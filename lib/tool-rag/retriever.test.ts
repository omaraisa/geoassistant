import { selectToolsForMessage } from './retriever';

describe('Tool-RAG Retriever', () => {
  describe('Arabic queries', () => {
    it('should select transaction tools for Arabic transaction query', () => {
      const result = selectToolsForMessage('كم عدد المعاملات في جزيرة ياس في 2023؟');
      
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
      expect(result.selectedToolNames).toContain('get_transaction_count');
    });

    it('should select sales tools for Arabic sales value query', () => {
      const result = selectToolsForMessage('ما هي إجمالي قيمة المبيعات في أبو ظبي في 2023؟');
      
      expect(result.selectedToolNames).toContain('get_municipality_sales');
      expect(result.selectedToolNames).toContain('get_total_sales_value');
    });

    it('should select rental tools for Arabic rental query', () => {
      const result = selectToolsForMessage('ابحث عن شقة غرفتين للإيجار بميزانية 120000');
      
      expect(result.selectedToolNames).toContain('find_units_by_budget');
    });

    it('should select supply tools for Arabic supply query', () => {
      const result = selectToolsForMessage('كم عدد الوحدات المتاحة في خليفة سيتي؟');
      
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
      expect(result.selectedToolNames).toContain('get_current_supply');
    });

    it('should select comparison tools for Arabic comparison query', () => {
      const result = selectToolsForMessage('قارن المبيعات بين جزيرة السعديات و جزيرة ياس');
      
      expect(result.selectedToolNames).toContain('compare_sales_between_districts');
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
    });

    it('should select municipality tools for Arabic top districts query', () => {
      const result = selectToolsForMessage('اعرض أفضل 5 مناطق من حيث المبيعات في أبو ظبي');
      
      expect(result.selectedToolNames).toContain('get_top_districts_in_municipality');
    });

    it('should select geo tools for Arabic list districts query', () => {
      const result = selectToolsForMessage('ما هي المناطق الموجودة في أبو ظبي؟');
      
      expect(result.selectedToolNames).toContain('get_districts');
    });

    it('should select geo tools for Arabic communities query', () => {
      const result = selectToolsForMessage('اعرض المجتمعات في الفلاح');
      
      expect(result.selectedToolNames).toContain('get_communities');
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
    });
  });

  describe('English queries', () => {
    it('should select transaction tools for English transaction query', () => {
      const result = selectToolsForMessage('How many transactions in Yas Island in 2024?');
      
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
      expect(result.selectedToolNames).toContain('get_transaction_count');
    });

    it('should select sales tools for English sales value query', () => {
      const result = selectToolsForMessage('What was the total sales value in Saadiyat Island in 2023?');
      
      expect(result.selectedToolNames).toContain('get_total_sales_value');
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
    });

    it('should select rental tools for English rental query', () => {
      const result = selectToolsForMessage('Find me a 2-bedroom apartment to rent for 120,000 AED');
      
      expect(result.selectedToolNames).toContain('find_units_by_budget');
    });

    it('should select supply tools for English supply query', () => {
      const result = selectToolsForMessage('What is the current housing supply in Khalifa City?');
      
      expect(result.selectedToolNames).toContain('get_current_supply');
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
    });

    it('should select comparison tools for English comparison query', () => {
      const result = selectToolsForMessage('Compare sales between Yas Island and Reem Island in 2024');
      
      expect(result.selectedToolNames).toContain('compare_sales_between_districts');
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
    });

    it('should select municipality tools for English municipality query', () => {
      const result = selectToolsForMessage('Show me total sales in Abu Dhabi City for 2023');
      
      expect(result.selectedToolNames).toContain('get_municipality_sales');
    });

    it('should select municipality tools for English top districts query', () => {
      const result = selectToolsForMessage('What are the top 5 districts by sales in Abu Dhabi City?');
      
      expect(result.selectedToolNames).toContain('get_top_districts_in_municipality');
    });

    it('should select geo tools for English list districts query', () => {
      const result = selectToolsForMessage('List all districts in Abu Dhabi');
      
      expect(result.selectedToolNames).toContain('get_districts');
    });

    it('should select geo tools for English communities query', () => {
      const result = selectToolsForMessage('List communities in Al Falah');
      
      expect(result.selectedToolNames).toContain('get_communities');
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
    });
  });

  describe('Edge cases', () => {
    it('should always include search_geospatial_metadata by default', () => {
      const result = selectToolsForMessage('sales in Yas 2023');
      
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
    });

    it('should handle empty message gracefully', () => {
      const result = selectToolsForMessage('');
      
      expect(result.selectedToolNames.length).toBeGreaterThan(0);
      expect(result.debug?.reason).toBe('fallback_all');
    });

    it('should handle ambiguous query with fallback', () => {
      const result = selectToolsForMessage('tell me about real estate');
      
      expect(result.selectedToolNames.length).toBeGreaterThan(0);
    });

    it('should respect topK limit', () => {
      const result = selectToolsForMessage('sales transactions value in Yas Island 2024', {
        topK: 5,
        fallbackK: 10,
        alwaysInclude: ['search_geospatial_metadata'],
      });
      
      expect(result.selectedToolNames.length).toBeLessThanOrEqual(6); // topK + always
    });

    it('should return debug info when enabled', () => {
      const result = selectToolsForMessage('transactions in Yas', {
        debug: true,
        topK: 5,
        fallbackK: 10,
        alwaysInclude: [],
      });
      
      expect(result.debug).toBeDefined();
      expect(result.debug?.reason).toBeDefined();
      expect(result.debug?.scored).toBeDefined();
    });
  });

  describe('Mixed language queries', () => {
    it('should handle mixed Arabic-English query', () => {
      const result = selectToolsForMessage('sales في جزيرة ياس for 2024');
      
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
      expect(result.selectedToolNames).toContain('get_total_sales_value');
    });

    it('should handle transliterated queries', () => {
      const result = selectToolsForMessage('transactions in Yas jazeera');
      
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
      expect(result.selectedToolNames).toContain('get_transaction_count');
    });
  });

  describe('Year patterns', () => {
    it('should recognize year patterns', () => {
      const result = selectToolsForMessage('sales in 2023');
      
      expect(result.selectedToolNames.length).toBeGreaterThan(0);
      expect(result.selectedToolNames).toContain('search_geospatial_metadata');
    });

    it('should recognize Arabic year numerals', () => {
      const result = selectToolsForMessage('المبيعات في ٢٠٢٣');
      
      expect(result.selectedToolNames.length).toBeGreaterThan(0);
    });
  });
});
