    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return { success: true, message: "User activated" };
    }),

  updateUserRole: protectedProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return { success: true, message: "User role updated" };
    }),

  getProjectList: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const offset = (input.page - 1) * input.pageSize;
      let records: any[] = [];
      let totalResult: any[] = [];

      if (input.status) {
        records = await db
          .select()
          .from(projects)
          .where(eq(projects.status, input.status as any))
          .limit(input.pageSize)
          .offset(offset);
        totalResult = await db
          .select()
          .from(projects)
          .where(eq(projects.status, input.status as any));
      } else {
        records = await db.select().from(projects).limit(input.pageSize).offset(offset);
        totalResult = await db.select().from(projects);
      }

      return {
        list: records,