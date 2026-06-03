from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

class Category(models.Model):
    """
    Categorizes issues logically within the system.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Issue(models.Model):
    """
    The core model representing a task, bug, or general issue logged in the system.
    """
    class IssueType(models.TextChoices):
        BUG = 'BUG', _('Bug')
        TASK = 'TASK', _('Task')
        ISSUE = 'ISSUE', _('General Issue')

    class IssueStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        UNDER_REVIEW = 'UNDER_REVIEW', _('Under Review')
        RESOLVED = 'RESOLVED', _('Resolved')

    class IssuePriority(models.TextChoices):
        LOW = 'LOW', _('Low')
        MEDIUM = 'MEDIUM', _('Medium')
        HIGH = 'HIGH', _('High')
        CRITICAL = 'CRITICAL', _('Critical')

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='issues')
    
    issue_type = models.CharField(max_length=10, choices=IssueType.choices, default=IssueType.TASK)
    priority = models.CharField(max_length=10, choices=IssuePriority.choices, default=IssuePriority.MEDIUM)
    status = models.CharField(max_length=15, choices=IssueStatus.choices, default=IssueStatus.PENDING)
    
    # Accountability Mapping
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_issues')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_issues')
    stakeholders = models.ManyToManyField(User, related_name='stakeholder_issues', blank=True)
    
    # Timeline
    expected_completion_date = models.DateField(null=True, blank=True)
    actual_completion_date = models.DateField(null=True, blank=True)
    
    # Audit Trail
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

class DelayLog(models.Model):
    """
    Captures specific delays associated with an issue, including root causes and duration.
    """
    class DelayCause(models.TextChoices):
        TECHNICAL = 'TECHNICAL', _('Technical Limitation')
        RESOURCE = 'RESOURCE', _('Resource Gap')
        THIRD_PARTY = 'THIRD_PARTY', _('Third Party Dependency')
        OTHER = 'OTHER', _('Other')

    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='delay_logs')
    root_cause = models.CharField(max_length=20, choices=DelayCause.choices, default=DelayCause.OTHER)
    root_cause_details = models.TextField(help_text="Detailed explanation of the root cause.")
    duration_of_delay = models.DurationField(help_text="Duration of the delay (e.g., '2 days', '04:00:00').")
    
    logged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='logged_delays')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Delay on {self.issue.title} - {self.get_root_cause_display()}"
