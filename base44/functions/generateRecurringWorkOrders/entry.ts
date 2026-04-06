import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function addFrequency(dateStr, value, unit) {
  const d = new Date(dateStr);
  if (unit === "days") d.setDate(d.getDate() + value);
  else if (unit === "weeks") d.setDate(d.getDate() + value * 7);
  else if (unit === "months") d.setMonth(d.getMonth() + value);
  else if (unit === "years") d.setFullYear(d.getFullYear() + value);
  return d.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function can be called by the scheduler (no user) or manually by admin
    // Use service role to access all accounts' recurring tasks
    const allTasks = await base44.asServiceRole.entities.RecurringTask.filter({ is_active: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    let generated = 0;
    let skipped = 0;

    for (const task of allTasks) {
      // Check if this task is due today or overdue
      const nextDue = task.next_due_date;
      if (!nextDue) {
        skipped++;
        continue;
      }

      const dueDate = new Date(nextDue);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate > today) {
        skipped++;
        continue;
      }

      // Task is due — create a work order
      const workOrderData = {
        summary: task.name,
        description: task.description || `Recurring maintenance task: ${task.name}`,
        category: task.category,
        urgency: task.urgency || "normal",
        status: "new",
        account_id: task.account_id,
        notify_tenant: true,
      };

      if (task.property_id) workOrderData.property_id = task.property_id;
      if (task.assigned_vendor_id) workOrderData.assigned_vendor_id = task.assigned_vendor_id;

      await base44.asServiceRole.entities.WorkOrder.create(workOrderData);

      // Advance the next_due_date by the frequency
      const newNextDue = addFrequency(todayStr, task.frequency_value, task.frequency_unit);
      await base44.asServiceRole.entities.RecurringTask.update(task.id, {
        last_generated_date: todayStr,
        next_due_date: newNextDue,
      });

      generated++;
      console.log(`Generated work order for task: ${task.name} (account: ${task.account_id})`);
    }

    console.log(`Recurring task run complete: ${generated} generated, ${skipped} skipped`);
    return Response.json({ success: true, generated, skipped });
  } catch (error) {
    console.error("Error generating recurring work orders:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});