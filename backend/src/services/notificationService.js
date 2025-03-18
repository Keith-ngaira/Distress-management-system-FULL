import { createNotification } from '../controllers/notificationController.js';
import { logger } from '../middleware/logger.js';

class NotificationService {
    // Notify when a new distress message is created
    async notifyNewDistressMessage(distressMessage, assignedToId) {
        try {
            await createNotification(
                assignedToId,
                'new_case',
                'New Case Assigned',
                `A new case has been assigned to you: ${distressMessage.subject}`,
                { distressMessageId: distressMessage.id },
                'distress_message',
                distressMessage.id,
                true
            );
        } catch (error) {
            logger.error('Error creating new case notification:', error);
        }
    }

    // Notify when case status changes
    async notifyCaseStatusChange(distressMessage, updatedBy) {
        try {
            if (distressMessage.assigned_to) {
                await createNotification(
                    distressMessage.assigned_to,
                    'case_update',
                    'Case Status Updated',
                    `Case status updated to: ${distressMessage.status}`,
                    { distressMessageId: distressMessage.id },
                    'distress_message',
                    distressMessage.id,
                    false
                );
            }
        } catch (error) {
            logger.error('Error creating case status notification:', error);
        }
    }

    // Notify when a new case update is added
    async notifyCaseUpdate(distressMessage, updateText, updatedBy) {
        try {
            if (distressMessage.assigned_to && distressMessage.assigned_to !== updatedBy) {
                await createNotification(
                    distressMessage.assigned_to,
                    'case_update',
                    'Case Updated',
                    `New update on case: ${distressMessage.subject}`,
                    { 
                        distressMessageId: distressMessage.id,
                        updateText: updateText
                    },
                    'distress_message',
                    distressMessage.id,
                    false
                );
            }
        } catch (error) {
            logger.error('Error creating case update notification:', error);
        }
    }

    // Notify when case is reassigned
    async notifyCaseReassignment(distressMessage, oldAssigneeId, newAssigneeId) {
        try {
            // Notify new assignee
            await createNotification(
                newAssigneeId,
                'case_assignment',
                'Case Assigned',
                `A case has been assigned to you: ${distressMessage.subject}`,
                { distressMessageId: distressMessage.id },
                'distress_message',
                distressMessage.id,
                true
            );

            // Notify old assignee
            if (oldAssigneeId) {
                await createNotification(
                    oldAssigneeId,
                    'case_reassignment',
                    'Case Reassigned',
                    `Case has been reassigned: ${distressMessage.subject}`,
                    { distressMessageId: distressMessage.id },
                    'distress_message',
                    distressMessage.id,
                    false
                );
            }
        } catch (error) {
            logger.error('Error creating case reassignment notification:', error);
        }
    }

    // Notify when case is resolved
    async notifyCaseResolution(distressMessage, resolvedBy) {
        try {
            const notifyUsers = [distressMessage.created_by];
            if (distressMessage.assigned_to && distressMessage.assigned_to !== resolvedBy) {
                notifyUsers.push(distressMessage.assigned_to);
            }

            for (const userId of notifyUsers) {
                if (userId) {
                    await createNotification(
                        userId,
                        'case_resolved',
                        'Case Resolved',
                        `Case has been resolved: ${distressMessage.subject}`,
                        { distressMessageId: distressMessage.id },
                        'distress_message',
                        distressMessage.id,
                        true
                    );
                }
            }
        } catch (error) {
            logger.error('Error creating case resolution notification:', error);
        }
    }
}

export default new NotificationService();
