import type { ReproductionStepStatus } from './types';
import type { ActionContext } from './actions';

export interface AssertionResult {
  status: ReproductionStepStatus;
  safeResult: string | null;
  error?: string;
}

export async function executeAssertVisible(
  ctx: ActionContext,
  selector: string | null
): Promise<AssertionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No selector for assert_visible' };

  try {
    const loc = ctx.page.locator(selector).first();
    await ctx.expect(loc).toBeVisible({ timeout: 15000 });
    return { status: 'passed', safeResult: `${selector} is visible` };
  } catch (err: any) {
    return { status: 'failed', safeResult: null, error: `Assert visible failed: ${err.message?.substring(0, 200)}` };
  }
}

export async function executeAssertText(
  ctx: ActionContext,
  selector: string | null,
  inputRef: string | null
): Promise<AssertionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No selector for assert_text' };
  const expected = inputRef || '';

  try {
    const loc = ctx.page.locator(selector).first();
    await ctx.expect(loc).toContainText(expected, { timeout: 15000 });
    return { status: 'passed', safeResult: `Text matches: "${expected.substring(0, 100)}"` };
  } catch (err: any) {
    return { status: 'failed', safeResult: null, error: `Assert text failed: ${err.message?.substring(0, 200)}` };
  }
}

export async function executeAssertUrl(
  ctx: ActionContext,
  selector: string | null
): Promise<AssertionResult> {
  if (!selector) return { status: 'failed', safeResult: null, error: 'No URL pattern for assert_url' };

  try {
    await ctx.expect(ctx.page).toHaveURL(new RegExp(selector), { timeout: 15000 });
    return { status: 'passed', safeResult: `URL matches pattern: ${selector}` };
  } catch (err: any) {
    const currentUrl = ctx.page.url();
    return { status: 'failed', safeResult: null, error: `Assert URL failed: expected ${selector}, got ${currentUrl}` };
  }
}

export async function executeAssertion(
  ctx: ActionContext,
  actionType: string,
  selector: string | null,
  inputRef: string | null
): Promise<AssertionResult> {
  switch (actionType) {
    case 'assert_visible':
      return executeAssertVisible(ctx, selector);
    case 'assert_text':
      return executeAssertText(ctx, selector, inputRef);
    case 'assert_url':
      return executeAssertUrl(ctx, selector);
    default:
      return { status: 'passed', safeResult: 'No assertion needed' };
  }
}