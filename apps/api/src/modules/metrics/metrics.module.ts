/**
 * Metrics Module
 * Manages metrics computation and evaluation suite
 */
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/errors.js';
import { Prisma } from '@prisma/client';

export interface MetricsConfig {
  includeAccuracy?: boolean;
  includePrecision?: boolean;
  includeRecall?: boolean;
  includeF1?: boolean;
  includeAUC?: boolean;
  includeCalibration?: boolean;
  customMetrics?: string[];
}

export interface ComputedMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  auc?: number;
  calibration?: Record<string, number>;
  custom?: Record<string, number>;
  computedAt: Date;
}

export class MetricsModule {
  private safeDivide(numerator: number, denominator: number): number {
    if (denominator === 0) {
      return 0;
    }
    return numerator / denominator;
  }

  private computeAuc(predictions: number[], labels: number[]): number {
    const pairs = predictions.map((score, idx) => ({ score, label: labels[idx] ?? 0 })).sort((a, b) => b.score - a.score);
    const positives = labels.filter((label) => label === 1).length;
    const negatives = labels.length - positives;
    if (positives === 0 || negatives === 0) {
      return 0;
    }

    let tp = 0;
    let fp = 0;
    let prevTpRate = 0;
    let prevFpRate = 0;
    let auc = 0;

    for (const pair of pairs) {
      if (pair.label === 1) {
        tp += 1;
      } else {
        fp += 1;
      }

      const tpr = tp / positives;
      const fpr = fp / negatives;
      auc += (fpr - prevFpRate) * (tpr + prevTpRate) * 0.5;
      prevTpRate = tpr;
      prevFpRate = fpr;
    }

    return Number(auc.toFixed(6));
  }

  async computeMetrics(
    runId: string,
    predictions: number[],
    labels: number[],
    config: MetricsConfig
  ): Promise<ComputedMetrics> {
    if (predictions.length === 0 || labels.length === 0 || predictions.length !== labels.length) {
      throw new HttpError(400, 'Predictions and labels must be non-empty arrays of equal length');
    }

    const predictedClasses = predictions.map((p) => (p >= 0.5 ? 1 : 0));
    const actualClasses = labels.map((l) => (l >= 0.5 ? 1 : 0));

    let tp = 0;
    let tn = 0;
    let fp = 0;
    let fn = 0;

    for (let i = 0; i < predictedClasses.length; i += 1) {
      const pred = predictedClasses[i];
      const actual = actualClasses[i];

      if (pred === 1 && actual === 1) tp += 1;
      if (pred === 0 && actual === 0) tn += 1;
      if (pred === 1 && actual === 0) fp += 1;
      if (pred === 0 && actual === 1) fn += 1;
    }

    const metrics: ComputedMetrics = { computedAt: new Date() };

    if (config.includeAccuracy) {
      metrics.accuracy = Number(((tp + tn) / predictedClasses.length).toFixed(6));
    }
    if (config.includePrecision) {
      metrics.precision = Number(this.safeDivide(tp, tp + fp).toFixed(6));
    }
    if (config.includeRecall) {
      metrics.recall = Number(this.safeDivide(tp, tp + fn).toFixed(6));
    }
    if (config.includeF1) {
      const precision = this.safeDivide(tp, tp + fp);
      const recall = this.safeDivide(tp, tp + fn);
      metrics.f1 = Number(this.safeDivide(2 * precision * recall, precision + recall).toFixed(6));
    }
    if (config.includeAUC) {
      metrics.auc = this.computeAuc(predictions, actualClasses);
    }
    if (config.includeCalibration) {
      const binCount = 10;
      const bins: Array<{ predSum: number; observedSum: number; count: number }> = Array.from({ length: binCount }, () => ({ predSum: 0, observedSum: 0, count: 0 }));
      predictions.forEach((score, idx) => {
        const binIndex = Math.min(binCount - 1, Math.max(0, Math.floor(score * binCount)));
        bins[binIndex].predSum += score;
        bins[binIndex].observedSum += actualClasses[idx];
        bins[binIndex].count += 1;
      });

      metrics.calibration = Object.fromEntries(
        bins
          .map((bin, idx) => {
            if (bin.count === 0) return null;
            const observedRate = bin.observedSum / bin.count;
            return [`bin_${idx}`, Number(observedRate.toFixed(6))];
          })
          .filter((entry): entry is [string, number] => entry !== null)
      );
    }

    if (config.customMetrics?.length) {
      metrics.custom = Object.fromEntries(config.customMetrics.map((name) => [name, 0]));
    }

    await prisma.analysisRun.update({
      where: { id: runId },
      data: { metricsJson: metrics as unknown as Prisma.InputJsonValue },
    });

    return metrics;
  }

  async compareMetrics(
    currentRunId: string,
    previousRunId: string
  ): Promise<Record<string, { current: number; previous: number; delta: number }>> {
    const [currentRun, previousRun] = await Promise.all([
      prisma.analysisRun.findUnique({ where: { id: currentRunId }, select: { metricsJson: true } }),
      prisma.analysisRun.findUnique({ where: { id: previousRunId }, select: { metricsJson: true } }),
    ]);

    if (!currentRun || !previousRun) {
      throw new HttpError(404, 'One or both analysis runs were not found');
    }

    const currentMetrics = (currentRun.metricsJson ?? {}) as Record<string, unknown>;
    const previousMetrics = (previousRun.metricsJson ?? {}) as Record<string, unknown>;

    const keys = new Set([...Object.keys(currentMetrics), ...Object.keys(previousMetrics)]);
    const comparison: Record<string, { current: number; previous: number; delta: number }> = {};

    for (const key of keys) {
      const currentValue = currentMetrics[key];
      const previousValue = previousMetrics[key];
      if (typeof currentValue === 'number' && typeof previousValue === 'number') {
        comparison[key] = {
          current: currentValue,
          previous: previousValue,
          delta: Number((currentValue - previousValue).toFixed(6)),
        };
      }
    }

    return comparison;
  }

  async publishMetrics(runId: string, experimentId: string, metrics: ComputedMetrics): Promise<void> {
    const [run, experiment] = await Promise.all([
      prisma.analysisRun.findUnique({
        where: { id: runId },
        select: { id: true, researchWorkspaceId: true },
      }),
      prisma.experiment.findUnique({
        where: { id: experimentId },
        select: { id: true, researchWorkspaceId: true },
      }),
    ]);

    if (!run) {
      throw new HttpError(404, 'Analysis run not found');
    }
    if (!experiment) {
      throw new HttpError(404, 'Experiment not found');
    }
    if (run.researchWorkspaceId !== experiment.researchWorkspaceId) {
      throw new HttpError(400, 'Run and experiment belong to different research workspaces');
    }

    await prisma.$transaction([
      prisma.analysisRun.update({
        where: { id: runId },
        data: { metricsJson: metrics as unknown as Prisma.InputJsonValue },
      }),
      prisma.experiment.update({
        where: { id: experimentId },
        data: { championRunId: runId },
      }),
    ]);
  }
}
