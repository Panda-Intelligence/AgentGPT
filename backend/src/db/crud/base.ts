import { AsyncSession } from 'sqlalchemy'; // 假设这是 SQLAlchemy 的类型

export abstract class BaseCrud {
  protected session: AsyncSession;

  constructor(session: AsyncSession) {
    this.session = session;
  }
}
