"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const appointment_reminder_scheduler_1 = require("./src/notifications/appointment-reminder.scheduler");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['error', 'warn', 'log'] });
    const scheduler = app.get(appointment_reminder_scheduler_1.AppointmentReminderScheduler);
    const count = await scheduler.scanAndEnqueueReminders();
    console.log(`Reminders enqueued: ${count}`);
    await app.close();
    process.exit(0);
}
void main();
//# sourceMappingURL=scratch-trigger-reminder.js.map