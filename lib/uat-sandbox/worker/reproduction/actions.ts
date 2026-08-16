import type { ReproductionActionType, ReproductionStepStatus } from './types';
import { resolveCredentialValue } from './executor';

export interface ActionContext {
  page: any;
  locator: any;
  expect: any;
}

export interface ActionResult {
  status: ReproductionStepStatus;
  safeResult: string | null;
  error?: string;
}

const SCRIPT_BLOCKER = `
  (function() {
    var _origEval = window.eval;
    window.eval = function() {
      console.error('[DFP Worker] eval blocked during reproduction');
      return undefined;
    };
    Object.defineProperty(window, 'eval', { value: window.eval, writable: false, configurable: false });
  })();
`;

export async function executeNavigate(
  ctx: ActionContext,
  selector: string | null,
  allowedOrigins: string[]
): Promise<ActionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No URL provided for navigate' };

  try {
    const url = new URL(selector);
    const isAllowed = allowedOrigins.some((o) => {
      try { return new URL(o).hostname === url.hostname; } catch { return false; }
    });
    if (!isAllowed) {
      return { status: 'blocked', safeResult: null, error: `Navigation blocked: ${url.hostname} not in allowed origins` };
    }
  } catch {
    return { status: 'failed', safeResult: null, error: 'Invalid URL for navigate' };
  }

  try {
    await ctx.page.goto(selector, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return { status: 'passed', safeResult: `Navigated to ${selector}` };
  } catch (err: any) {
    return { status: 'failed', safeResult: null, error: `Navigation failed: ${err.message?.substring(0, 200)}` };
  }
}

export async function executeClick(
  ctx: ActionContext,
  selector: string | null
): Promise<ActionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No selector for click' };

  try {
    const loc = selector.startsWith('data-testid=') || selector.startsWith('[data-testid')
      ? ctx.page.locator(selector)
      : ctx.page.locator(selector);
    await loc.first().click({ timeout: 15000 });
    return { status: 'passed', safeResult: `Clicked ${selector}` };
  } catch (err: any) {
    return { status: 'failed', safeResult: null, error: `Click failed: ${err.message?.substring(0, 200)}` };
  }
}

export async function executeFill(
  ctx: ActionContext,
  selector: string | null,
  inputRef: string | null,
  credentials: Record<string, string>
): Promise<ActionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No selector for fill' };
  if (!inputRef) return { status: 'failed', safeResult: null, error: 'No input reference for fill' };

  const value = resolveCredentialValue(inputRef, credentials);

  try {
    const loc = ctx.page.locator(selector).first();
    await loc.fill(value, { timeout: 15000 });
    return { status: 'passed', safeResult: `Filled ${selector} with ${inputRef}` };
  } catch (err: any) {
    return { status: 'failed', safeResult: null, error: `Fill failed: ${err.message?.substring(0, 200)}` };
  }
}

export async function executeSelect(
  ctx: ActionContext,
  selector: string | null,
  inputRef: string | null,
  credentials: Record<string, string>
): Promise<ActionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No selector for select' };
  if (!inputRef) return { status: 'failed', safeResult: null, error: 'No input reference for select' };

  const value = resolveCredentialValue(inputRef, credentials);

  try {
    const loc = ctx.page.locator(selector).first();
    await loc.selectOption(value, { timeout: 15000 });
    return { status: 'passed', safeResult: `Selected ${inputRef} in ${selector}` };
  } catch (err: any) {
    return { status: 'failed', safeResult: null, error: `Select failed: ${err.message?.substring(0, 200)}` };
  }
}

export async function executeCheck(
  ctx: ActionContext,
  selector: string | null
): Promise<ActionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No selector for check' };

  try {
    const loc = ctx.page.locator(selector).first();
    await loc.check({ timeout: 15000 });
    return { status: 'passed', safeResult: `Checked ${selector}` };
  } catch (err: any) {
    return { status: 'failed', safeResult: null, error: `Check failed: ${err.message?.substring(0, 200)}` };
  }
}

export async function executeUncheck(
  ctx: ActionContext,
  selector: string | null
): Promise<ActionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No selector for uncheck' };

  try {
    const loc = ctx.page.locator(selector).first();
    await loc.uncheck({ timeout: 15000 });
    return { status: 'passed', safeResult: `Unchecked ${selector}` };
  } catch (err: any) {
    return { status: 'failed', safeResult: null, error: `Uncheck failed: ${err.message?.substring(0, 200)}` };
  }
}

export async function executeWaitFor(
  ctx: ActionContext,
  selector: string | null
): Promise<ActionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No selector for wait_for' };

  try {
    const loc = ctx.page.locator(selector).first();
    await loc.waitFor({ state: 'visible', timeout: 20000 });
    return { status: 'passed', safeResult: `Element ${selector} visible` };
  } catch (err: any) {
    return { status: 'failed', safeResult: null, error: `Wait failed: ${err.message?.substring(0, 200)}` };
  }
}

export async function executeCustomCheckpoint(
  _ctx: ActionContext,
  targetDesc: string | null
): Promise<ActionResult> {
  return { status: 'passed', safeResult: `Checkpoint: ${targetDesc || 'Manual checkpoint'}` };
}

export async function executeAction(
  ctx: ActionContext,
  actionType: ReproductionActionType,
  selector: string | null,
  inputRef: string | null,
  targetDesc: string | null,
  credentials: Record<string, string>
): Promise<ActionResult> {
  switch (actionType) {
    case 'navigate':
      return executeNavigate(ctx, selector, []);
    case 'click':
      return executeClick(ctx, selector);
    case 'fill':
      return executeFill(ctx, selector, inputRef, credentials);
    case 'select':
      return executeSelect(ctx, selector, inputRef, credentials);
    case 'check':
      return executeCheck(ctx, selector);
    case 'uncheck':
      return executeUncheck(ctx, selector);
    case 'wait_for':
      return executeWaitFor(ctx, selector);
    case 'custom_checkpoint':
      return executeCustomCheckpoint(ctx, targetDesc);
    case 'upload_test_file':
      return { status: 'blocked', safeResult: null, error: 'Upload test file not supported in this worker version' };
    default:
      return { status: 'blocked', safeResult: null, error: `Unsupported action: ${actionType}` };
  }
}