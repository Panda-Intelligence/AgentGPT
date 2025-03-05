import { Base } from '../base'; // 假设 Base 是一个基类
import { Column, String, Text, DateTime } from 'sqlalchemy'; // 假设这是 SQLAlchemy 的类型

export class AgentRun extends Base {
  static tableName = 'agent_run';

  @Column(String, { nullable: false })
  user_id: string;

  @Column(Text, { nullable: false })
  goal: string;

  @Column(DateTime, { default: () => 'CURRENT_TIMESTAMP', nullable: false })
  create_date: DateTime;
}

export class AgentTask extends Base {
  static tableName = 'agent_task';

  @Column(String, { nullable: false })
  run_id: string;

  @Column(String, { nullable: false })
  type_: string;

  @Column(DateTime, { default: () => 'CURRENT_TIMESTAMP', nullable: false })
  create_date: DateTime;
}
