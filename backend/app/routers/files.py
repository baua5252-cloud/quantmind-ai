import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Conversation, Message
from app.auth import get_current_user
from app.services.file_processor import extract_text
from app.services.ai_engine import generate_response_stream, generate_title

router = APIRouter(prefix="/api/files", tags=["files"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "csv", "xlsx", "xls", "txt", "md", "json", "py",
                       "js", "ts", "html", "css", "png", "jpg", "jpeg", "gif", "webp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("/upload-and-chat")
async def upload_and_chat(
    file: UploadFile = File(...),
    message: str = Form("Analyze this file and summarize it."),
    conversation_id: str = Form(""),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate file
    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")

    # Extract text
    file_text = await extract_text(file)

    # Get or create conversation
    conv_uuid = None
    if conversation_id:
        conv_uuid = conversation_id

    if conv_uuid:
        result = await db.execute(
            select(Conversation)
            .where(Conversation.id == conv_uuid, Conversation.user_id == user.id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=user.id, title=f"File: {filename}")
        db.add(conversation)
        await db.flush()

    # Save user message with file reference
    user_content = f"[Uploaded file: {filename}]\n\n{message}"
    user_msg = Message(conversation_id=conversation.id, role="user", content=user_content)
    db.add(user_msg)
    await db.flush()

    # Load history
    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    history = [{"role": m.role, "content": m.content} for m in msgs_result.scalars().all()]

    is_new = len(history) <= 1
    conv_id = str(conversation.id)
    await db.commit()

    async def event_stream():
        full_response = []
        try:
            async for chunk in generate_response_stream(
                conversation_history=history[:-1],
                user_message=message,
                file_context=f"File: {filename}\n\n{file_text}",
            ):
                full_response.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

            assistant_content = "".join(full_response)

            from app.database import async_session
            async with async_session() as save_db:
                assistant_msg = Message(
                    conversation_id=conv_id,
                    role="assistant",
                    content=assistant_content,
                )
                save_db.add(assistant_msg)

                if is_new:
                    title = await generate_title(f"File: {filename} - {message}")
                    result = await save_db.execute(
                        select(Conversation).where(Conversation.id == conv_id)
                    )
                    conv = result.scalar_one_or_none()
                    if conv:
                        conv.title = title

                await save_db.commit()

            yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id, 'title': title if is_new else None})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
