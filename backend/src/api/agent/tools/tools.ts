import { Tool } from './tool';
import { SearchTool } from './search';
import { SidSearchTool } from './sidsearch';
import { WikipediaSearchTool } from './wikipedia-search';
import { CodeTool } from './code';
import { ConcludeTool } from './conclude';
import { ImageTool } from './image';
import { ReasonTool } from './reason';
import { OpenAIFunctionTool } from './open-ai-function';

export type ToolType =
  | 'search'
  | 'sid-search'
  | 'wikipedia'
  | 'code'
  | 'conclude'
  | 'image'
  | 'reason'
  | 'openai-function';

export interface ToolMetadata {
  name: string;
  description: string;
  schema: object;
}

export class ToolRegistry {
  private static tools: Map<string, Tool> = new Map([
    ['search', new SearchTool()],
    ['sid-search', new SidSearchTool()],
    ['wikipedia', new WikipediaSearchTool()],
    ['code', new CodeTool()],
    ['conclude', new ConcludeTool()],
    ['image', new ImageTool()],
    ['reason', new ReasonTool()],
    ['openai-function', new OpenAIFunctionTool()],
  ]);

  static getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  static getTool(name: ToolType): Tool {
    const t = this.tools.get(name);
    if (!t) {
      throw new Error(`Tool ${name} not found`);
    }
    return t;
  }

  static getExternalTools() {
    return [
      this.tools.get('wikipedia'),
      this.tools.get('image'),
      this.tools.get('code'),
      this.tools.get('sid')
    ] as Tool[]
  }

  static getDefaultTools() {
    return [this.tools.get('search')]
  }

  static getAvailableTools() {
    return [...ToolRegistry.getExternalTools(), ...ToolRegistry.getDefaultTools()]
  }
}


// async def get_user_tools(
//   tool_names: List[str], user: UserBase, crud: OAuthCrud
// ) -> List[Type[Tool]]:
//   tools = list(map(get_tool_from_name, tool_names)) + get_default_tools()
//   return [tool for tool in tools if await tool.dynamic_available(user, crud)]


