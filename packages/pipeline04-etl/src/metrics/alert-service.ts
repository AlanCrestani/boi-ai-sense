/**
 * ETL Alert Service
 * Manages alert configuration, evaluation, and delivery for ETL operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { MetricsService, ETLMetric } from './metrics-service.js';

export interface AlertConfig {
  id?: string;
  organizationId: string;
  alertName: string;
  alertType: 'error_rate' | 'processing_time' | 'sla_breach' | 'data_quality' | 'dlq_size' | 'system_health';
  metricType: string;
  conditionOperator: '>' | '<' | '>=' | '<=' | '==';
  thresholdValue: number;
  evaluationWindowMinutes: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  emailEnabled: boolean;
  slackEnabled: boolean;
  slackWebhookUrl?: string;
  emailRecipients: string[];
  isEnabled: boolean;
  alertCooldownMinutes: number;
  escalationEnabled: boolean;
  escalationDelayMinutes: number;
  alertTitleTemplate?: string;
  alertMessageTemplate?: string;
  createdBy?: string;
}

export interface AlertHistory {
  id: string;
  organizationId: string;
  alertConfigId: string;
  alertName: string;
  alertType: string;
  severity: string;
  triggeredAt: Date;
  metricValue: number;
  thresholdValue: number;
  conditionMet: string;
  entityType?: string;
  entityId?: string;
  pipelineStage?: string;
  contextData: Record<string, any>;
  emailSent: boolean;
  slackSent: boolean;
  emailSentAt?: Date;
  slackSentAt?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface AlertEvaluation {
  alertConfig: AlertConfig;
  currentValue: number;
  thresholdValue: number;
  conditionMet: boolean;
  shouldTrigger: boolean;
  contextData: Record<string, any>;
}

export class AlertService {
  private supabase: SupabaseClient;
  private metricsService: MetricsService;
  private evaluationInterval: NodeJS.Timeout | null = null;
  private readonly evaluationIntervalMs = 60000; // 1 minute

  constructor(supabase: SupabaseClient, metricsService: MetricsService) {
    this.supabase = supabase;
    this.metricsService = metricsService;
  }

  /**
   * Create a new alert configuration
   */
  async createAlertConfig(config: Omit<AlertConfig, 'id'>): Promise<string> {
    const { data, error } = await this.supabase
      .from('etl_alerts_config')
      .insert({
        organization_id: config.organizationId,
        alert_name: config.alertName,
        alert_type: config.alertType,
        metric_type: config.metricType,
        condition_operator: config.conditionOperator,
        threshold_value: config.thresholdValue,
        evaluation_window_minutes: config.evaluationWindowMinutes,
        severity: config.severity,
        email_enabled: config.emailEnabled,
        slack_enabled: config.slackEnabled,
        slack_webhook_url: config.slackWebhookUrl,
        email_recipients: config.emailRecipients,
        is_enabled: config.isEnabled,
        alert_cooldown_minutes: config.alertCooldownMinutes,
        escalation_enabled: config.escalationEnabled,
        escalation_delay_minutes: config.escalationDelayMinutes,
        alert_title_template: config.alertTitleTemplate,
        alert_message_template: config.alertMessageTemplate,
        created_by: config.createdBy
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create alert config:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Update an existing alert configuration
   */
  async updateAlertConfig(id: string, updates: Partial<AlertConfig>): Promise<void> {
    const updateData: any = {};

    if (updates.alertName !== undefined) updateData.alert_name = updates.alertName;
    if (updates.alertType !== undefined) updateData.alert_type = updates.alertType;
    if (updates.metricType !== undefined) updateData.metric_type = updates.metricType;
    if (updates.conditionOperator !== undefined) updateData.condition_operator = updates.conditionOperator;
    if (updates.thresholdValue !== undefined) updateData.threshold_value = updates.thresholdValue;
    if (updates.evaluationWindowMinutes !== undefined) updateData.evaluation_window_minutes = updates.evaluationWindowMinutes;
    if (updates.severity !== undefined) updateData.severity = updates.severity;
    if (updates.emailEnabled !== undefined) updateData.email_enabled = updates.emailEnabled;
    if (updates.slackEnabled !== undefined) updateData.slack_enabled = updates.slackEnabled;
    if (updates.slackWebhookUrl !== undefined) updateData.slack_webhook_url = updates.slackWebhookUrl;
    if (updates.emailRecipients !== undefined) updateData.email_recipients = updates.emailRecipients;
    if (updates.isEnabled !== undefined) updateData.is_enabled = updates.isEnabled;
    if (updates.alertCooldownMinutes !== undefined) updateData.alert_cooldown_minutes = updates.alertCooldownMinutes;
    if (updates.escalationEnabled !== undefined) updateData.escalation_enabled = updates.escalationEnabled;
    if (updates.escalationDelayMinutes !== undefined) updateData.escalation_delay_minutes = updates.escalationDelayMinutes;
    if (updates.alertTitleTemplate !== undefined) updateData.alert_title_template = updates.alertTitleTemplate;
    if (updates.alertMessageTemplate !== undefined) updateData.alert_message_template = updates.alertMessageTemplate;

    updateData.updated_at = new Date().toISOString();

    const { error } = await this.supabase
      .from('etl_alerts_config')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Failed to update alert config:', error);
      throw error;
    }
  }

  /**
   * Delete an alert configuration
   */
  async deleteAlertConfig(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('etl_alerts_config')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete alert config:', error);
      throw error;
    }
  }

  /**
   * Get all alert configurations for an organization
   */
  async getAlertConfigs(organizationId: string): Promise<AlertConfig[]> {
    const { data, error } = await this.supabase
      .from('etl_alerts_config')
      .select('*')
      .eq('organization_id', organizationId)
      .order('alert_name');

    if (error) {
      console.error('Failed to get alert configs:', error);
      throw error;
    }

    return data?.map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      alertName: row.alert_name,
      alertType: row.alert_type,
      metricType: row.metric_type,
      conditionOperator: row.condition_operator,
      thresholdValue: row.threshold_value,
      evaluationWindowMinutes: row.evaluation_window_minutes,
      severity: row.severity,
      emailEnabled: row.email_enabled,
      slackEnabled: row.slack_enabled,
      slackWebhookUrl: row.slack_webhook_url,
      emailRecipients: row.email_recipients || [],
      isEnabled: row.is_enabled,
      alertCooldownMinutes: row.alert_cooldown_minutes,
      escalationEnabled: row.escalation_enabled,
      escalationDelayMinutes: row.escalation_delay_minutes,
      alertTitleTemplate: row.alert_title_template,
      alertMessageTemplate: row.alert_message_template,
      createdBy: row.created_by
    })) || [];
  }

  /**
   * Evaluate all enabled alerts for an organization
   */
  async evaluateAlerts(organizationId: string): Promise<AlertEvaluation[]> {
    const alertConfigs = await this.getAlertConfigs(organizationId);
    const enabledAlerts = alertConfigs.filter(config => config.isEnabled);

    const evaluations: AlertEvaluation[] = [];

    for (const alertConfig of enabledAlerts) {
      try {
        const evaluation = await this.evaluateAlert(alertConfig);
        evaluations.push(evaluation);

        if (evaluation.shouldTrigger) {
          await this.triggerAlert(alertConfig, evaluation);
        }
      } catch (error) {
        console.error(`Failed to evaluate alert ${alertConfig.alertName}:`, error);
      }
    }

    return evaluations;
  }

  /**
   * Evaluate a single alert configuration
   */
  private async evaluateAlert(alertConfig: AlertConfig): Promise<AlertEvaluation> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (alertConfig.evaluationWindowMinutes * 60 * 1000));

    // Query relevant metrics
    const metrics = await this.metricsService.queryMetrics({
      organizationId: alertConfig.organizationId,
      metricTypes: [alertConfig.metricType],
      startTime,
      endTime,
      limit: 1000
    });

    let currentValue = 0;
    let contextData: Record<string, any> = {};

    if (metrics.length === 0) {
      // No metrics available for evaluation
      return {
        alertConfig,
        currentValue: 0,
        thresholdValue: alertConfig.thresholdValue,
        conditionMet: false,
        shouldTrigger: false,
        contextData: { message: 'No metrics available for evaluation' }
      };
    }

    // Calculate current value based on alert type
    switch (alertConfig.alertType) {
      case 'error_rate':
        currentValue = this.calculateErrorRate(metrics);
        contextData = {
          totalMetrics: metrics.length,
          evaluationWindow: `${alertConfig.evaluationWindowMinutes} minutes`
        };
        break;

      case 'processing_time':
        currentValue = this.calculateAverageProcessingTime(metrics);
        contextData = {
          samplesCount: metrics.length,
          evaluationWindow: `${alertConfig.evaluationWindowMinutes} minutes`
        };
        break;

      case 'sla_breach':
        currentValue = this.calculateSLABreachCount(metrics, alertConfig.thresholdValue);
        contextData = {
          breachCount: currentValue,
          totalSamples: metrics.length
        };
        break;

      case 'data_quality':
        currentValue = this.calculateAverageDataQuality(metrics);
        contextData = {
          qualitySamples: metrics.length,
          evaluationWindow: `${alertConfig.evaluationWindowMinutes} minutes`
        };
        break;

      default:
        // For other alert types, use the latest metric value
        currentValue = metrics[0]?.metricValue || 0;
        contextData = { latestMetricTimestamp: metrics[0]?.timestamp };
        break;
    }

    // Evaluate condition
    const conditionMet = this.evaluateCondition(
      currentValue,
      alertConfig.conditionOperator,
      alertConfig.thresholdValue
    );

    // Check if we should trigger (considering cooldown)
    const shouldTrigger = conditionMet && await this.shouldTriggerAlert(alertConfig);

    return {
      alertConfig,
      currentValue,
      thresholdValue: alertConfig.thresholdValue,
      conditionMet,
      shouldTrigger,
      contextData
    };
  }

  /**
   * Trigger an alert and send notifications
   */
  private async triggerAlert(alertConfig: AlertConfig, evaluation: AlertEvaluation): Promise<void> {
    // Create alert history entry
    const { data: alertHistory, error } = await this.supabase
      .from('etl_alert_history')
      .insert({
        organization_id: alertConfig.organizationId,
        alert_config_id: alertConfig.id,
        alert_name: alertConfig.alertName,
        alert_type: alertConfig.alertType,
        severity: alertConfig.severity,
        metric_value: evaluation.currentValue,
        threshold_value: evaluation.thresholdValue,
        condition_met: this.formatCondition(
          evaluation.currentValue,
          alertConfig.conditionOperator,
          evaluation.thresholdValue
        ),
        context_data: evaluation.contextData
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create alert history:', error);
      return;
    }

    const alertHistoryId = alertHistory.id;

    // Send notifications
    const notifications = await Promise.allSettled([
      alertConfig.emailEnabled ? this.sendEmailAlert(alertConfig, evaluation, alertHistoryId) : null,
      alertConfig.slackEnabled ? this.sendSlackAlert(alertConfig, evaluation, alertHistoryId) : null
    ]);

    // Update delivery status
    const emailSent = notifications[0]?.status === 'fulfilled' && notifications[0].value === true;
    const slackSent = notifications[1]?.status === 'fulfilled' && notifications[1].value === true;

    await this.supabase
      .from('etl_alert_history')
      .update({
        email_sent: emailSent,
        slack_sent: slackSent,
        email_sent_at: emailSent ? new Date().toISOString() : null,
        slack_sent_at: slackSent ? new Date().toISOString() : null
      })
      .eq('id', alertHistoryId);

    console.log(`Alert triggered: ${alertConfig.alertName} (${alertConfig.severity})`);
  }

  /**
   * Send email alert notification
   */
  private async sendEmailAlert(
    alertConfig: AlertConfig,
    evaluation: AlertEvaluation,
    alertHistoryId: string
  ): Promise<boolean> {
    try {
      const title = this.formatAlertTemplate(
        alertConfig.alertTitleTemplate || '[{severity}] ETL Alert: {alertName}',
        alertConfig,
        evaluation
      );

      const message = this.formatAlertTemplate(
        alertConfig.alertMessageTemplate || `Alert: {alertName}
Severity: {severity}
Current Value: {currentValue}
Threshold: {conditionOperator} {thresholdValue}
Time: {timestamp}

Context: {contextData}`,
        alertConfig,
        evaluation
      );

      // Use Supabase Auth to send email
      // Note: This would need to be implemented based on your email service
      console.log('Email alert would be sent:', { title, message, recipients: alertConfig.emailRecipients });

      return true;
    } catch (error) {
      console.error('Failed to send email alert:', error);
      return false;
    }
  }

  /**
   * Send Slack alert notification
   */
  private async sendSlackAlert(
    alertConfig: AlertConfig,
    evaluation: AlertEvaluation,
    alertHistoryId: string
  ): Promise<boolean> {
    if (!alertConfig.slackWebhookUrl) {
      console.warn('Slack webhook URL not configured for alert:', alertConfig.alertName);
      return false;
    }

    try {
      const severityColors = {
        low: '#36a64f',
        medium: '#ff9500',
        high: '#ff4500',
        critical: '#ff0000'
      };

      const payload = {
        attachments: [
          {
            color: severityColors[alertConfig.severity],
            title: `🚨 ETL Alert: ${alertConfig.alertName}`,
            fields: [
              {
                title: 'Severity',
                value: alertConfig.severity.toUpperCase(),
                short: true
              },
              {
                title: 'Current Value',
                value: evaluation.currentValue.toString(),
                short: true
              },
              {
                title: 'Threshold',
                value: `${alertConfig.conditionOperator} ${alertConfig.thresholdValue}`,
                short: true
              },
              {
                title: 'Alert Type',
                value: alertConfig.alertType,
                short: true
              }
            ],
            footer: 'ETL Monitoring System',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };

      const response = await fetch(alertConfig.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
      return false;
    }
  }

  /**
   * Check if an alert should trigger considering cooldown period
   */
  private async shouldTriggerAlert(alertConfig: AlertConfig): Promise<boolean> {
    const cooldownStart = new Date(Date.now() - (alertConfig.alertCooldownMinutes * 60 * 1000));

    const { data, error } = await this.supabase
      .from('etl_alert_history')
      .select('id')
      .eq('alert_config_id', alertConfig.id)
      .gte('triggered_at', cooldownStart.toISOString())
      .limit(1);

    if (error) {
      console.error('Failed to check alert cooldown:', error);
      return true; // Default to allowing the alert
    }

    return !data || data.length === 0;
  }

  /**
   * Get alert history for an organization
   */
  async getAlertHistory(
    organizationId: string,
    limit: number = 100,
    resolved?: boolean
  ): Promise<AlertHistory[]> {
    let query = this.supabase
      .from('etl_alert_history')
      .select('*')
      .eq('organization_id', organizationId)
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (resolved !== undefined) {
      query = query.eq('resolved', resolved);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get alert history:', error);
      throw error;
    }

    return data?.map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      alertConfigId: row.alert_config_id,
      alertName: row.alert_name,
      alertType: row.alert_type,
      severity: row.severity,
      triggeredAt: new Date(row.triggered_at),
      metricValue: row.metric_value,
      thresholdValue: row.threshold_value,
      conditionMet: row.condition_met,
      entityType: row.entity_type,
      entityId: row.entity_id,
      pipelineStage: row.pipeline_stage,
      contextData: row.context_data || {},
      emailSent: row.email_sent,
      slackSent: row.slack_sent,
      emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
      slackSentAt: row.slack_sent_at ? new Date(row.slack_sent_at) : undefined,
      acknowledged: row.acknowledged,
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      acknowledgedBy: row.acknowledged_by,
      resolved: row.resolved,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by,
      resolutionNotes: row.resolution_notes
    })) || [];
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertHistoryId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('etl_alert_history')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId
      })
      .eq('id', alertHistoryId);

    if (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertHistoryId: string,
    userId: string,
    resolutionNotes?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('etl_alert_history')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_notes: resolutionNotes
      })
      .eq('id', alertHistoryId);

    if (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  }

  /**
   * Start automatic alert evaluation
   */
  startAlertEvaluation(organizationIds: string[]): void {
    this.evaluationInterval = setInterval(async () => {
      for (const organizationId of organizationIds) {
        try {
          await this.evaluateAlerts(organizationId);
        } catch (error) {
          console.error(`Failed to evaluate alerts for organization ${organizationId}:`, error);
        }
      }
    }, this.evaluationIntervalMs);

    console.log('Alert evaluation started');
  }

  /**
   * Stop automatic alert evaluation
   */
  stopAlertEvaluation(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
      console.log('Alert evaluation stopped');
    }
  }

  // Private helper methods

  private calculateErrorRate(metrics: ETLMetric[]): number {
    if (metrics.length === 0) return 0;

    const errorMetrics = metrics.filter(m =>
      m.metricName.includes('error') ||
      m.metadata?.success === false
    );

    return (errorMetrics.length / metrics.length) * 100;
  }

  private calculateAverageProcessingTime(metrics: ETLMetric[]): number {
    if (metrics.length === 0) return 0;

    const processingTimeMetrics = metrics.filter(m =>
      m.metricName.includes('processing') ||
      m.metricName.includes('duration')
    );

    if (processingTimeMetrics.length === 0) return 0;

    const sum = processingTimeMetrics.reduce((acc, m) => acc + m.metricValue, 0);
    return sum / processingTimeMetrics.length;
  }

  private calculateSLABreachCount(metrics: ETLMetric[], slaThreshold: number): number {
    return metrics.filter(m =>
      m.metricName.includes('processing') &&
      m.metricValue > slaThreshold
    ).length;
  }

  private calculateAverageDataQuality(metrics: ETLMetric[]): number {
    if (metrics.length === 0) return 100;

    const qualityMetrics = metrics.filter(m =>
      m.metricName.includes('quality') ||
      m.metricName.includes('score')
    );

    if (qualityMetrics.length === 0) return 100;

    const sum = qualityMetrics.reduce((acc, m) => acc + m.metricValue, 0);
    return sum / qualityMetrics.length;
  }

  private evaluateCondition(
    currentValue: number,
    operator: string,
    thresholdValue: number
  ): boolean {
    switch (operator) {
      case '>':
        return currentValue > thresholdValue;
      case '<':
        return currentValue < thresholdValue;
      case '>=':
        return currentValue >= thresholdValue;
      case '<=':
        return currentValue <= thresholdValue;
      case '==':
        return currentValue === thresholdValue;
      default:
        return false;
    }
  }

  private formatCondition(
    currentValue: number,
    operator: string,
    thresholdValue: number
  ): string {
    return `${currentValue} ${operator} ${thresholdValue}`;
  }

  private formatAlertTemplate(
    template: string,
    alertConfig: AlertConfig,
    evaluation: AlertEvaluation
  ): string {
    return template
      .replace(/{alertName}/g, alertConfig.alertName)
      .replace(/{severity}/g, alertConfig.severity)
      .replace(/{currentValue}/g, evaluation.currentValue.toString())
      .replace(/{thresholdValue}/g, evaluation.thresholdValue.toString())
      .replace(/{conditionOperator}/g, alertConfig.conditionOperator)
      .replace(/{timestamp}/g, new Date().toISOString())
      .replace(/{contextData}/g, JSON.stringify(evaluation.contextData, null, 2));
  }
}