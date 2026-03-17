from django.contrib import admin
from .models import Category, Issue, DelayLog

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

class DelayLogInline(admin.TabularInline):
    """
    Allows adding delay logs directly from the Issue admin page.
    """
    model = DelayLog
    extra = 1
    readonly_fields = ('created_at',)

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    """
    Configures the Django Admin to display issues in a searchable, filtered table view.
    """
    list_display = ('title', 'issue_type', 'priority', 'status', 'reporter', 'assignee', 'created_at')
    list_filter = ('status', 'issue_type', 'priority', 'created_at', 'category')
    search_fields = ('title', 'description', 'reporter__username', 'assignee__username')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('stakeholders',)
    inlines = [DelayLogInline]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'issue_type', 'priority', 'status')
        }),
        ('Personnel', {
            'fields': ('reporter', 'assignee', 'stakeholders')
        }),
        ('Timeline', {
            'fields': ('expected_completion_date', 'actual_completion_date', 'created_at', 'updated_at')
        }),
    )

@admin.register(DelayLog)
class DelayLogAdmin(admin.ModelAdmin):
    """
    Configures the Django Admin to display delay logs for business analytics.
    """
    list_display = ('issue', 'root_cause', 'duration_of_delay', 'logged_by', 'created_at')
    list_filter = ('root_cause', 'created_at')
    search_fields = ('issue__title', 'root_cause_details', 'logged_by__username')
    readonly_fields = ('created_at',)
