import type { Page } from '@playwright/test';
import type { ResearcherFormData } from './dummy-data';

/**
 * Page Object Model for /register.
 *
 * The form inputs have no id/for associations — they are identified by
 * their `name` attribute (react-hook-form) or placeholder text.
 * Radix UI Select triggers are identified by their placeholder text.
 */
export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/register', { waitUntil: 'networkidle' });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private input(name: string) {
    return this.page.locator(`input[name="${name}"]`);
  }

  private textarea(name: string) {
    return this.page.locator(`textarea[name="${name}"]`);
  }

  /** Click a Radix Select trigger by its current placeholder text, then pick an option. */
  private async selectOption(triggerPlaceholder: string, optionText: string | RegExp) {
    await this.page
      .locator('button[role="combobox"]')
      .filter({ hasText: triggerPlaceholder })
      .click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  // ── Account section ───────────────────────────────────────────────────────

  async fillFirstName(v: string)       { await this.input('firstName').fill(v); }
  async fillLastName(v: string)        { await this.input('lastName').fill(v); }
  async fillEmail(v: string)           { await this.input('email').fill(v); }
  async fillInstitutionEmail(v: string){ await this.input('institutionEmail').fill(v); }
  async fillPhoneCode(v: string)       { await this.input('phoneCode').fill(v); }
  async fillMobileNumber(v: string)    { await this.input('mobileNumber').fill(v); }
  async fillPassword(v: string)        { await this.input('password').fill(v); }
  async fillConfirmPassword(v: string) { await this.input('confirmPassword').fill(v); }
  async fillDateOfBirth(v: string)     { await this.input('dateOfBirth').fill(v); }

  // ── Institutional section ─────────────────────────────────────────────────

  async fillInstitution(v: string)  { await this.input('institution').fill(v); }
  async fillDepartment(v: string)   { await this.input('department').fill(v); }
  async fillRoleTitle(v: string)    { await this.input('roleTitle').fill(v); }
  async fillCountry(v: string)      { await this.input('country').fill(v); }
  async fillCity(v: string)         { await this.input('city').fill(v); }

  async selectResearcherType(_v: string) {
    await this.selectOption('Select type', /student researcher/i);
  }

  async selectYearsOfExperience(_v: string) {
    await this.selectOption('Select range', /2.4 years/i);
  }

  // ── Research section ──────────────────────────────────────────────────────

  async fillResearchArea(v: string)       { await this.input('researchArea').fill(v); }
  async fillShortBio(v: string)           { await this.textarea('shortBio').fill(v); }
  async fillResearchInterests(v: string)  { await this.textarea('researchInterests').fill(v); }
  async fillPlatformPurpose(v: string)    { await this.textarea('platformPurpose').fill(v); }
  async fillExpectedDatasets(v: string)   { await this.textarea('expectedDatasets').fill(v); }

  async selectCollaborationType(_v: string) {
    await this.selectOption('Select collaboration type', /solo research/i);
  }

  /**
   * Check a feature-needs checkbox by its label text.
   * Walks up to the FormItem container which holds both the checkbox and label.
   */
  async checkFeatureNeed(labelText: string) {
    // The FormItem is a div with class containing 'rounded-xl border p-4'
    // It contains both the checkbox button and the label
    const formItem = this.page
      .locator('div.rounded-xl.border.p-4')
      .filter({ hasText: labelText })
      .first();
    const cb = formItem.locator('button[role="checkbox"]');
    const state = await cb.getAttribute('data-state');
    if (state !== 'checked') await cb.click();
  }

  // ── Compliance section ────────────────────────────────────────────────────

  async selectUsesSensitiveData(_v: string) {
    // First "Select option" trigger
    const triggers = this.page.locator('button[role="combobox"]').filter({ hasText: 'Select option' });
    await triggers.first().click();
    await this.page.getByRole('option', { name: /^no$/i }).first().click();
  }

  async selectIrbRequired(_v: string) {
    // Second "Select option" trigger
    const triggers = this.page.locator('button[role="combobox"]').filter({ hasText: 'Select option' });
    await triggers.last().click();
    await this.page.getByRole('option', { name: /^no$/i }).first().click();
  }

  async selectDataSensitivityLevel(_v: string) {
    await this.selectOption('Select classification', /^public$/i);
  }

  async fillSupervisorName(v: string)  { await this.input('supervisorName').fill(v); }
  async fillSupervisorEmail(v: string) { await this.input('supervisorEmail').fill(v); }

  // ── Acknowledgment section ────────────────────────────────────────────────

  /**
   * Check an acknowledgment checkbox by matching its label text.
   * Uses the rounded border container that wraps each acknowledgment item.
   */
  private async checkAcknowledgmentByLabel(labelText: string) {
    // Acknowledgment items are in a div.space-y-4 container
    // Each item is a flex row with the checkbox and a label div
    const item = this.page
      .locator('div.flex.flex-row.items-start')
      .filter({ hasText: labelText })
      .first();
    const cb = item.locator('button[role="checkbox"]');
    const state = await cb.getAttribute('data-state');
    if (state !== 'checked') await cb.click();
  }

  async checkConfirmAccuracy()    { await this.checkAcknowledgmentByLabel('I confirm the information provided is accurate'); }
  async checkAgreeTerms()         { await this.checkAcknowledgmentByLabel('I agree to the platform terms'); }
  async checkUnderstandApproval() { await this.checkAcknowledgmentByLabel('I understand my account will remain pending'); }

  // ── Submit ────────────────────────────────────────────────────────────────

  async submit() {
    await this.page.getByRole('button', { name: /submit application/i }).click();
  }

  // ── Composite: fill the entire form ──────────────────────────────────────

  async fillAll(data: ResearcherFormData) {
    // Account
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillEmail(data.email);
    await this.fillInstitutionEmail(data.institutionEmail);
    await this.fillPhoneCode(data.phoneCode);
    await this.fillMobileNumber(data.mobileNumber);
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.password);
    await this.fillDateOfBirth(data.dateOfBirth);

    // Institutional
    await this.fillInstitution(data.institution);
    await this.fillDepartment(data.department);
    await this.fillRoleTitle(data.roleTitle);
    await this.selectResearcherType(data.researcherType);
    await this.fillCountry(data.country);
    await this.fillCity(data.city);
    await this.selectYearsOfExperience(data.yearsOfExperience);

    // Research
    await this.fillResearchArea(data.researchArea);
    await this.selectCollaborationType(data.collaborationType);
    await this.fillShortBio(data.shortBio);
    await this.fillResearchInterests(data.researchInterests);
    await this.fillPlatformPurpose(data.platformPurpose);
    await this.fillExpectedDatasets(data.expectedDatasets);
    await this.checkFeatureNeed('Dataset Upload');
    await this.checkFeatureNeed('Analysis Jobs');

    // Compliance
    await this.selectUsesSensitiveData(data.usesSensitiveData);
    await this.selectIrbRequired(data.irbRequired);
    await this.selectDataSensitivityLevel(data.dataSensitivityLevel);
    await this.fillSupervisorName(data.supervisorName);
    await this.fillSupervisorEmail(data.supervisorEmail);

    // Acknowledgment
    await this.checkConfirmAccuracy();
    await this.checkAgreeTerms();
    await this.checkUnderstandApproval();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async isOnSuccessPage(): Promise<boolean> {
    return this.page.locator('text=Application Submitted').isVisible();
  }

  async getApplicationId(): Promise<string | null> {
    // The success page renders InfoBox components: label above, value below
    const box = this.page.locator('div.rounded-2xl').filter({ hasText: 'Application ID' });
    if (await box.isVisible()) {
      return box.locator('p.mt-1').textContent();
    }
    return null;
  }
}
