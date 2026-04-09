import { proxyPost, proxyGet } from '../../config/aiProxy';

/**
 * AI Quality Lead Service
 * Handles communication with the Raver AI Quality Platform
 */

/**
 * Analyze an asset (campaign, session, or specific video) and return a quality score
 */
export const scoreAsset = (body: any) => proxyPost('/api/v1/quality-lead/score', body);

/**
 * Retrieve a detailed quality report for a given report ID
 */
export const getReport = (reportId: string) => proxyGet(`/api/v1/quality-lead/report/${reportId}`);
