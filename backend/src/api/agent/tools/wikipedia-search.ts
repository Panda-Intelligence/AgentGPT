import { z } from 'zod';
import axios from 'axios';
import { Tool, ToolContext } from './tool';

interface WikipediaResult {
  title: string;
  extract: string;
  pageId: number;
}

export class WikipediaSearchTool extends Tool {
  name = 'wikipedia';
  description = 'Search Wikipedia for information';
  schema = z.string().describe('The Wikipedia search query');

  protected async _call(query: string): Promise<string> {
    try {
      const results = await this.wikipediaSearch(query);
      if (!results.length) {
        return 'No Wikipedia results found';
      }

      // Return the most relevant result
      const bestResult = results[0];
      return `Wikipedia article: ${bestResult.title}\n\n${bestResult.extract}`;
    } catch (error) {
      console.error('Wikipedia search error:', error);
      return 'Error searching Wikipedia';
    }
  }

  private async wikipediaSearch(query: string): Promise<WikipediaResult[]> {
    try {
      const response = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          format: 'json',
          list: 'search',
          srsearch: query,
          srlimit: 1,
          srprop: 'snippet',
          origin: '*',
        },
      });

      if (!response.data.query?.search?.length) {
        return [];
      }

      const pageId = response.data.query.search[0].pageid;
      const contentResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          format: 'json',
          prop: 'extracts',
          exintro: true,
          explaintext: true,
          pageids: pageId,
          origin: '*',
        },
      });

      const page = contentResponse.data.query.pages[pageId];
      return [{
        title: page.title,
        extract: page.extract,
        pageId: page.pageid,
      }];
    } catch (error) {
      console.error('Wikipedia API error:', error);
      return [];
    }
  }
}
