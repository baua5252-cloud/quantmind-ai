import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas import (
    ChatRequest, ConversationResponse,
    ConversationDetailResponse, MessageResponse,
)
from app.auth import get_current_user
from app.services.ai_engine import generate_response_stream, generate_title

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at)
    )
    conv_dict = {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "messages": msgs_result.scalars().all(),
    }
    return conv_dict


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)


@router.post("/send")
async def send_message(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get or create conversation
    if req.conversation_id:
        result = await db.execute(
            select(Conversation)
            .where(Conversation.id == req.conversation_id, Conversation.user_id == user.id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=user.id, title="New Chat")
        db.add(conversation)
        await db.flush()

    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=req.message,
    )
    db.add(user_msg)
    await db.flush()

    # Load conversation history
    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    history = [{"role": m.role, "content": m.content} for m in msgs_result.scalars().all()]

    # Generate title for new conversations
    is_new = len(history) <= 1
    conv_id = str(conversation.id)

    # We need a reference to save the assistant message after streaming
    # We'll commit what we have, then stream
    await db.commit()

    async def event_stream():
        full_response = []
        try:
            async for chunk in generate_response_stream(
                conversation_history=history[:-1],  # exclude the latest user msg (added separately)
                user_message=req.message,
                web_search=req.web_search,
            ):
                full_response.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

            assistant_content = "".join(full_response)

            # Save assistant message in a new session
            from app.database import async_session
            async with async_session() as save_db:
                assistant_msg = Message(
                    conversation_id=conv_id,
                    role="assistant",
                    content=assistant_content,
                )
                save_db.add(assistant_msg)

                # Generate title for new conversations
                if is_new:
                    title = await generate_title(req.message)
                    result = await save_db.execute(
                        select(Conversation).where(Conversation.id == conv_id)
                    )
                    conv = result.scalar_one_or_none()
                    if conv:
                        conv.title = title

                await save_db.commit()

            title_to_send = title if is_new else None
            yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id, 'title': title_to_send})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
