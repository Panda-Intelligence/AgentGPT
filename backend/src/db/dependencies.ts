import { AsyncSession } from 'sqlalchemy'; // 假设这是 SQLAlchemy 的类型
import { Request } from 'hono'; // 假设 Hono 提供 Request 类型

export async function getDbSession(request: Request): Promise<AsyncSession> {
  const session: AsyncSession = request.app.state.db_session_factory();
  try {
    yield session;
    await session.commit();
  } finally {
    await session.close();
  }
}
