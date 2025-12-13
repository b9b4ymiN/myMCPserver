import { stockValuationTools } from '../tools/stockValuation';

describe('Stock Valuation Tools', () => {
  describe('calculate_pe_band', () => {
    it('should calculate PE band correctly', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_pe_band');
      const result = await tool!.handler({
        symbol: 'TEST',
        currentPrice: 150,
        eps: 5,
        historicalPEs: [20, 22, 25, 23, 21, 19]
      });

      expect(result.currentPE).toBe(30);
      expect(result.symbol).toBe('TEST');
      expect(result.recommendation).toBe('Overvalued');
      expect(result.minPE).toBe(19);
      expect(result.maxPE).toBe(25);
    });

    it('should handle missing EPS', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_pe_band');
      const result = await tool!.handler({
        symbol: 'TEST',
        currentPrice: 150,
        eps: 0
      });

      expect(result.currentPE).toBe(0);
    });

    it('should use default PEs when none provided', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_pe_band');
      const result = await tool!.handler({
        symbol: 'TEST',
        currentPrice: 100,
        eps: 5
      });

      expect(result.currentPE).toBe(20);
      expect(result.historicalPEs).toBeUndefined(); // Should use defaults internally
    });
  });

  describe('calculate_ddm', () => {
    it('should calculate DDM valuation correctly', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_ddm');
      const result = await tool!.handler({
        symbol: 'TEST',
        currentPrice: 100,
        dividend: 4,
        requiredReturn: 0.1,
        growthRate: 0.05
      });

      expect(result.symbol).toBe('TEST');
      expect(result.intrinsicValue).toBe(84); // (4 * 1.05) / (0.1 - 0.05)
      expect(result.marginOfSafety).toBeCloseTo(19.05, 2);
      expect(result.recommendation).toBe('Hold'); // 19.05% is within the -20% to 20% range for Hold
    });

    it('should handle zero dividend', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_ddm');
      const result = await tool!.handler({
        symbol: 'TEST',
        currentPrice: 100,
        dividend: 0,
        requiredReturn: 0.1,
        growthRate: 0.05
      });

      expect(result.intrinsicValue).toBe(0);
    });

    it('should validate required return > growth rate', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_ddm');

      await expect(tool!.handler({
        symbol: 'TEST',
        currentPrice: 100,
        dividend: 4,
        requiredReturn: 0.05,
        growthRate: 0.1
      })).rejects.toThrow('Required return must be greater than growth rate');
    });
  });

  describe('calculate_dcf', () => {
    it('should calculate DCF valuation correctly', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_dcf');
      const result = await tool!.handler({
        symbol: 'TEST',
        currentPrice: 100,
        freeCashFlow: 4000000,
        sharesOutstanding: 1000000,
        growthRate: 0.08,
        discountRate: 0.1
      });

      expect(result.symbol).toBe('TEST');
      expect(result.projections).toHaveLength(5);
      expect(result.intrinsicValue).toBeGreaterThan(0);
      expect(result.recommendation).toBeDefined();
      expect(result.freeCashFlow).toBe(4000000);
    });

    it('should handle custom projection years', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_dcf');
      const result = await tool!.handler({
        symbol: 'TEST',
        currentPrice: 100,
        freeCashFlow: 4000000,
        sharesOutstanding: 1000000,
        years: 10,
        growthRate: 0.08,
        discountRate: 0.1
      });

      expect(result.projections).toHaveLength(10);
    });

    it('should validate discount rate > terminal growth rate', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_dcf');

      await expect(tool!.handler({
        symbol: 'TEST',
        currentPrice: 100,
        freeCashFlow: 4000000,
        sharesOutstanding: 1000000,
        growthRate: 0.08,
        discountRate: 0.03,
        terminalGrowthRate: 0.05
      })).rejects.toThrow('Discount rate must be greater than terminal growth rate');
    });

    it('should validate positive free cash flow', async () => {
      const tool = stockValuationTools.find(t => t.name === 'calculate_dcf');

      await expect(tool!.handler({
        symbol: 'TEST',
        currentPrice: 100,
        freeCashFlow: -1000000,
        sharesOutstanding: 1000000,
        growthRate: 0.08,
        discountRate: 0.1
      })).rejects.toThrow('Free cash flow must be positive');
    });
  });
});