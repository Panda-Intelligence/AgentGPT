import { UserBase } from '@/schemas/user'; // 假设 UserBase 是一个类型
import { getCurrentUser } from '@/dependencies'; // 假设 getCurrentUser 是一个函数
import { LLM_MODEL_MAX_TOKENS } from '@/schemas/agent'; // 假设 LLM_MODEL_MAX_TOKENS 是一个对象

interface ModelWithAccess {
  name: string;
  max_tokens: number;
  has_access: boolean;
}

class ModelWithAccessImpl implements ModelWithAccess {
  name: string;
  max_tokens: number;
  has_access: boolean;

  constructor(name: string, max_tokens: number, user: UserBase | null) {
    this.name = name;
    this.max_tokens = max_tokens;
    this.has_access = user !== null;
  }

  static fromModel(name: string, max_tokens: number, user: UserBase | null): ModelWithAccess {
    return new ModelWithAccessImpl(name, max_tokens, user);
  }
}

router.get('', async (req: Request, res: Response) => {
  const user: UserBase | null = await getCurrentUser(req);
  const models: ModelWithAccess[] = Object.entries(LLM_MODEL_MAX_TOKENS).map(([model, tokens]) =>
    ModelWithAccessImpl.fromModel(model, tokens, user)
  );

  return res.json(models);
});

export default router;
