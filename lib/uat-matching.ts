import {
  type WizardApplicationData,
  type IndustryExperience,
  type MatchingProfile,
  type ProjectMatchingRequirements,
  type TesterMatchResult,
  type MatchingDimension,
  type SuitabilityLabel,
  DEVICE_KEY_MAP,
  INDUSTRY_KEY_MAP,
} from './uat-application-types';

export function generateMatchingTags(data: WizardApplicationData): string[] {
  const tags: Set<string> = new Set();

  if (data.experienceLevel === 'Complete beginner') { tags.add('beginner'); tags.add('needs-intro-training'); }
  else if (data.experienceLevel === 'Some general experience') tags.add('intermediate');
  else if (data.experienceLevel === 'Regular technology user') tags.add('experienced');
  else if (data.experienceLevel === 'Previous UAT or QA experience') tags.add('experienced');
  else if (data.experienceLevel === 'Professional testing experience') tags.add('professional-qa');

  for (const act of data.testingActivities) {
    const lower = act.toLowerCase();
    if (lower.includes('script')) tags.add('guided-testing');
    if (lower.includes('exploring')) tags.add('exploratory-testing');
    if (lower.includes('journey')) tags.add('journey-testing');
    if (lower.includes('form')) tags.add('form-testing');
    if (lower.includes('payment') || lower.includes('checkout')) tags.add('payments-testing');
    if (lower.includes('design') || lower.includes('comparing')) tags.add('visual-review');
    if (lower.includes('accessibility')) tags.add('accessibility-testing');
    if (lower.includes('security')) tags.add('security-testing-authorised');
    if (lower.includes('email') || lower.includes('notification')) tags.add('email-testing');
    if (lower.includes('retest')) tags.add('retesting');
    if (lower.includes('spoken')) tags.add('spoken-feedback');
    if (lower.includes('screen recording')) tags.add('video-evidence');
    if (lower.includes('mobile responsiveness')) tags.add('mobile-testing');
  }

  if (data.capabilities.screenshots) tags.add('screenshot-evidence');
  if (data.capabilities.screen_recording) tags.add('video-evidence');
  if (data.capabilities.video_calls) tags.add('spoken-feedback');

  const bt = data.practicalBugReport;
  if (bt?.bugTitle && bt?.stepsToReproduce) {
    const reportDetail = (bt.stepsToReproduce?.length || 0) + (bt.expectedResult?.length || 0) + (bt.actualResult?.length || 0);
    if (reportDetail < 40) tags.add('basic-bug-reports');
    else if (reportDetail < 120) tags.add('clear-bug-reports');
    else tags.add('strong-bug-reports');
    if (bt.additionalNotes && bt.additionalNotes.length > 10) tags.add('strong-bug-reports');
  }

  for (const d of data.devices) {
    const key = DEVICE_KEY_MAP[d];
    if (key) tags.add(key);
  }
  if (data.devices.length >= 3) tags.add('multi-device');
  if (data.internetConnection.includes('Mobile data')) tags.add('mobile-data');
  if (data.testEnvironments.some((e) => e.toLowerCase().includes('slow') || e.toLowerCase().includes('weak'))) tags.add('slow-connection');
  if (data.browsers.length >= 2) tags.add('multi-browser');

  for (const ie of data.industryExperience) {
    const key = INDUSTRY_KEY_MAP[ie.industry];
    if (key) tags.add(key);
  }

  if (data.shortNoticeAvailable === 'Yes') tags.add('short-notice');
  if (data.availabilityTimes.includes('Morning (8am–12pm)')) tags.add('daytime');
  if (data.availabilityTimes.includes('Evening (5pm–9pm)')) tags.add('evenings');
  if (data.availabilityDays.some((d) => d === 'Saturday' || d === 'Sunday')) tags.add('weekends');
  if (data.availabilityHours === 'Less than 2 hours per week') tags.add('under-two-hours-weekly');
  if (data.availabilityHours === '2–5 hours per week') tags.add('two-to-five-hours-weekly');
  if (data.availabilityHours === '6–10 hours per week') tags.add('six-to-ten-hours-weekly');
  if (data.availabilityHours === 'More than 10 hours per week') tags.add('over-ten-hours-weekly');
  if (data.communicationMethods.includes('Video call')) tags.add('video-call-available');
  if (data.communicationMethods.length === 1 && data.communicationMethods[0] === 'Written tasks only') tags.add('written-only');

  return Array.from(tags).sort();
}

export function buildMatchingProfile(data: WizardApplicationData): MatchingProfile {
  return {
    experienceLevel: data.experienceLevel,
    industryConfidence: Object.fromEntries(
      data.industryExperience.map((ie) => [INDUSTRY_KEY_MAP[ie.industry] || ie.industry.toLowerCase().replace(/\s+/g, '-'), ie.confidence])
    ),
    bugReportScore: scoreBugReport(data.practicalBugReport),
    deviceCoverage: data.devices.map((d) => DEVICE_KEY_MAP[d] || d),
    browserCoverage: data.browsers,
    testingActivities: data.testingActivities,
    preferredDifficulty: data.preferredTestingLevel,
    accessibilityCapability: data.accessibilityCapabilities,
    availabilityHours: data.availabilityHours,
    responseSpeed: data.responseSpeed,
    communicationMethods: data.communicationMethods,
    conflictFlag: data.projectConflictStatus === 'Yes',
    trainingNeeds: data.experienceLevel === 'Complete beginner' ? ['intro-training'] : [],
    currentAssignmentLoad: 0,
  };
}

export function scoreBugReport(report: PracticalBugReport | undefined): number {
  if (!report || !report.bugTitle || !report.stepsToReproduce) return 0;
  let score = 0;
  if (report.bugTitle.length >= 5) score += 1;
  if (report.stepsToReproduce.length >= 20) score += 1;
  if (report.expectedResult.length >= 5) score += 1;
  if (report.actualResult.length >= 5) score += 1;
  if (report.deviceBrowser.length >= 3) score += 1;
  if (report.happenedAgain) score += 1;
  const detail = report.stepsToReproduce.length + report.additionalNotes.length;
  if (detail > 150) score = Math.min(5, score + 1);
  return Math.min(5, score);
}

export function calculateMatchResult(
  profile: MatchingProfile,
  requirements: ProjectMatchingRequirements,
): Omit<TesterMatchResult, 'testerId' | 'calculatedAt'> {
  const required = requirements.required;
  const preferred = requirements.preferred;
  const missingRequirements: string[] = [];
  const dimensions: Record<MatchingDimension, number> = {
    deviceMatch: 50,
    industryMatch: 50,
    skillsMatch: 50,
    availabilityMatch: 50,
    communicationMatch: 50,
    reportingMatch: 50,
    accessibilityMatch: 50,
  };

  if (required.deviceTypes && required.deviceTypes.length > 0) {
    const hits = required.deviceTypes.filter((rd) =>
      profile.deviceCoverage.some((dc) => dc.toLowerCase().includes(rd.toLowerCase()))
    ).length;
    if (hits === 0) missingRequirements.push(`Missing required device: ${required.deviceTypes.join(', ')}`);
    dimensions.deviceMatch = Math.round((hits / required.deviceTypes.length) * 100);
  }

  if (required.browsers && required.browsers.length > 0) {
    const hits = required.browsers.filter((rb) =>
      profile.browserCoverage.some((bc) => bc.toLowerCase().includes(rb.toLowerCase()))
    ).length;
    if (hits === 0) missingRequirements.push(`Missing required browser: ${required.browsers.join(', ')}`);
    dimensions.deviceMatch = Math.round((dimensions.deviceMatch + (hits / required.browsers.length) * 100) / 2);
  }

  if (required.testingActivities && required.testingActivities.length > 0) {
    const actLower = profile.testingActivities.map((a) => a.toLowerCase());
    const hits = required.testingActivities.filter((ra) =>
      actLower.some((a) => a.includes(ra.toLowerCase()))
    ).length;
    if (hits === 0) missingRequirements.push(`Missing required testing activity: ${required.testingActivities.join(', ')}`);
    dimensions.skillsMatch = Math.round((hits / required.testingActivities.length) * 100);
  }

  if (required.screenRecording && !profile.testingActivities.some((a) => a.toLowerCase().includes('screen recording'))) {
    missingRequirements.push('Screen recording capability required');
    dimensions.skillsMatch = Math.max(0, dimensions.skillsMatch - 30);
  }

  if (required.accessibilityExperience) {
    if (profile.accessibilityCapability.length === 0) {
      missingRequirements.push('Accessibility experience required');
      dimensions.accessibilityMatch = 0;
    } else {
      dimensions.accessibilityMatch = Math.min(100, profile.accessibilityCapability.length * 25);
    }
  }

  if (required.communicationMethod) {
    if (!profile.communicationMethods.some((m) => m.toLowerCase().includes(required.communicationMethod!.toLowerCase()))) {
      missingRequirements.push(`Communication method required: ${required.communicationMethod}`);
      dimensions.communicationMatch = 20;
    } else {
      dimensions.communicationMatch = 100;
    }
  }

  if (preferred?.industries && preferred.industries.length > 0) {
    const hits = preferred.industries.filter((pi) =>
      Object.keys(profile.industryConfidence).some((k) => k === pi)
    ).length;
    dimensions.industryMatch = Math.round(40 + (hits / preferred.industries.length) * 60);
  }

  dimensions.reportingMatch = Math.min(100, profile.bugReportScore * 20);

  if (preferred?.reportingStrength) {
    const gap = preferred.reportingStrength - profile.bugReportScore;
    if (gap > 0) dimensions.reportingMatch = Math.max(10, dimensions.reportingMatch - gap * 15);
  }

  const avgScore = Object.values(dimensions).reduce((a, b) => a + b, 0) / MATCHING_DIMENSIONS_COUNT;

  let suitabilityLabel: SuitabilityLabel;
  if (missingRequirements.length > 0) suitabilityLabel = 'Does not meet required criteria';
  else if (avgScore >= 85) suitabilityLabel = 'Excellent match';
  else if (avgScore >= 65) suitabilityLabel = 'Strong match';
  else if (avgScore >= 40) suitabilityLabel = 'Possible match';
  else suitabilityLabel = 'Manual review';

  let explanation = '';
  if (suitabilityLabel === 'Excellent match') explanation = `Excellent match across all dimensions (${Math.round(avgScore)}%). Strong device coverage and relevant skills.`;
  else if (suitabilityLabel === 'Strong match') {
    const strengths = Object.entries(dimensions).filter(([, v]) => v >= 70).map(([k]) => k.replace('Match', ''));
    explanation = `Strong match: ${strengths.slice(0, 3).join(', ')}. Average ${Math.round(avgScore)}%.`;
  } else if (suitabilityLabel === 'Possible match') explanation = `Possible match at ${Math.round(avgScore)}%. Some requirements partially met.`;
  else if (suitabilityLabel === 'Does not meet required criteria') explanation = `Missing: ${missingRequirements.join('; ')}`;
  else explanation = 'Manual staff review recommended.';

  return { dimensionScores: dimensions, suitabilityLabel, explanation, missingRequirements };
}

const MATCHING_DIMENSIONS_COUNT = 7;