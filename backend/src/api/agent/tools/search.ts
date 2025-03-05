import { z } from 'zod';
import axios from 'axios';
import { Tool } from './tool';
import { summarizeSearchResults } from './utils';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export class SearchTool extends Tool {
  name = 'search';
  description = 'Search the internet for information';
  schema = z.string().describe('The search query');

  private readonly GOOGLE_API_KEY: string;
  private readonly GOOGLE_CSE_ID: string;
  private readonly MAX_SEARCH_RESULTS = 4;

  constructor() {
    super();
    this.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
    this.GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || '';

    if (!this.GOOGLE_API_KEY || !this.GOOGLE_CSE_ID) {
      throw new Error('Google API key or CSE ID not configured');
    }
  }

  protected async _call(query: string): Promise<string> {
    try {
      const results = await this.googleSearch(query);
      if (!results.length) {
        return 'No results found';
      }

      return await summarizeSearchResults(
        results,
        query,
        this.context.model_settings.language
      );
    } catch (error) {
      console.error('Search error:', error);
      return 'Error performing search';
    }
  }

  private async googleSearch(query: string): Promise<SearchResult[]> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/customsearch/v1',
        {
          params: {
            key: this.GOOGLE_API_KEY,
            cx: this.GOOGLE_CSE_ID,
            q: query,
            num: this.MAX_SEARCH_RESULTS,
          },
        }
      );

      if (!response.data.items) {
        return [];
      }

      return response.data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));
    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  }

  private async fetchWebPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching webpage:', error);
      return '';
    }
  }

  private extractMainContent(html: string): string {
    // Simple content extraction - you might want to use a proper HTML parser
    const textContent = html.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return textContent.substring(0, 1000); // Limit content length
  }
}
