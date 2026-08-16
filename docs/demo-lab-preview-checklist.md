# DFP Demo Lab preview checklist

Use this checklist against the Readdy or deployment preview for pull request #25.

## Core routes

- [ ] `/demos` loads without authentication or database content.
- [ ] `/demos/business-command-centre` loads the standalone Command Centre workspace.
- [ ] `/demos/ai-lead-system` loads the standalone AI Lead & Sales workspace.
- [ ] `/demos/customer-portal` loads the standalone Customer Project Portal.
- [ ] Every demo's **Back to Demo Lab** link returns to `/demos`.
- [ ] Product pages display the **Open Demo Lab** call to action.
- [ ] The header Portfolio menu and footer link both open `/demos`.

## Business Command Centre

- [ ] All five navigation sections open: Overview, Projects, Team workload, Tasks and Finance.
- [ ] Project filters and project selection update the detail panel.
- [ ] Reassigning Chris Morgan's task updates capacity and warning state.
- [ ] Task filters work and tasks can be completed and reopened.
- [ ] Finance cards, chart bars, invoice summary and milestones respond to clicks.
- [ ] The five-step guided tour changes sections in order.
- [ ] Reset returns the demo to its starting state.

## AI Lead & Sales System

- [ ] All six sections open: Lead inbox, Qualification, Reply, Proposal, Pipeline and Automation.
- [ ] Selecting a lead updates the contact and opportunity record.
- [ ] AI qualification updates the score and unlocks the next stage.
- [ ] Reply generation and approval update the lead state.
- [ ] Proposal creation and simulated sending update the opportunity.
- [ ] Moving opportunities in the pipeline keeps qualification, reply and proposal states consistent.
- [ ] Weighted forecast values use UK pound formatting.
- [ ] The six-step guided tour and reset both work.

## Customer Project Portal

- [ ] All six sections open: Overview, Milestones, Approvals, Messages, Files and Billing.
- [ ] Selecting milestones updates the milestone detail.
- [ ] Approving the design changes project progress and decision status.
- [ ] Requesting changes produces the alternative decision state.
- [ ] Messages can be drafted and added to the simulated thread.
- [ ] The attachment action records simulated activity.
- [ ] A simulated upload adds the client logo pack to Files.
- [ ] Simulated downloads do not request a real file.
- [ ] Recording a simulated payment updates paid and remaining totals.
- [ ] No Stripe, payment provider or external checkout is contacted.
- [ ] The six-step guided tour and reset both work.

## Responsive and accessibility checks

- [ ] Landing cards remain readable at 320px, 768px and desktop widths.
- [ ] Demo side navigation stacks correctly on mobile.
- [ ] No horizontal page overflow appears.
- [ ] Buttons and links can be reached using the keyboard.
- [ ] Visible focus styles appear on interactive controls.
- [ ] Text remains readable against dark backgrounds.
- [ ] The simulated-data notice is visible on every demo.

## Release decision

Only mark the pull request ready for review after the preview passes the core routes, all three reset flows, mobile layout checks and the simulated-payment safety check.
