"""
Constants for the core app (activity log, documents, etc.).
"""

# Activity log action flags (aligned with Django admin LogEntry)
ACTIVITY_LOG_ADDITION = 1
ACTIVITY_LOG_CHANGE = 2
ACTIVITY_LOG_DELETION = 3

ACTIVITY_LOG_ACTION_FLAG_CHOICES = [
    (ACTIVITY_LOG_ADDITION, "Addition"),
    (ACTIVITY_LOG_CHANGE, "Change"),
    (ACTIVITY_LOG_DELETION, "Deletion"),
]
