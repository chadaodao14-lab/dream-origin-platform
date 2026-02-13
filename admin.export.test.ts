    it("should have percentages that sum to approximately 100", async () => {
      const data = await reportService.generateReportData();

      const sourcePercentageSum = data.fundSources.reduce((sum, s) => sum + s.percentage, 0);
      const usagePercentageSum = data.fundUsage.reduce((sum, u) => sum + u.percentage, 0);

      // Allow small rounding errors
      expect(Math.abs(sourcePercentageSum - 100)).toBeLessThan(1);
      expect(Math.abs(usagePercentageSum - 100)).toBeLessThan(1);
    });
  });
