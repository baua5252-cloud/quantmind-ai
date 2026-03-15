from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

_db_url = settings.async_database_url
_is_sqlite = _db_url.startswith("sqlite")
_engine_kwargs = {} if _is_sqlite else {"pool_size": 20, "max_overflow": 10}
engine = create_async_engine(_db_url, echo=settings.DEBUG, **_engine_kwargs)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession: # type: ignore
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
