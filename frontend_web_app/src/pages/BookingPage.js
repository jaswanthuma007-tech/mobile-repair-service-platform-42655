import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Select, Textarea, Badge } from '../components/ui';
import { createRepairRequest } from '../services/repairRequestsService';
import { useToast } from '../components/ToastProvider';

const DEVICE_TYPES = ['iPhone', 'Android Phone', 'Tablet', 'Laptop', 'Other'];
const STEPS = ['Device', 'Issue', 'Schedule', 'Contact', 'Confirm', 'Success'];

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}
function isPhone(v) {
  const digits = String(v || '').replace(/[^\d]/g, '');
  return digits.length >= 10;
}

/**
 * PUBLIC_INTERFACE
 * Customer booking flow with animated steps.
 */
export default function BookingPage() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const [form, setForm] = useState({
    deviceType: '',
    issueDescription: '',
    preferredDate: '',
    preferredTime: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    consent: false
  });

  const [errors, setErrors] = useState({});

  const stepErrors = useMemo(() => {
    const e = {};
    if (step === 0) {
      if (!form.deviceType) e.deviceType = 'Please select a device type.';
    }
    if (step === 1) {
      if (!form.issueDescription || form.issueDescription.trim().length < 10)
        e.issueDescription = 'Please describe the issue (at least 10 characters).';
    }
    if (step === 2) {
      if (!form.preferredDate) e.preferredDate = 'Please choose a preferred date.';
      if (!form.preferredTime) e.preferredTime = 'Please choose a preferred time.';
    }
    if (step === 3) {
      if (!form.contactName || form.contactName.trim().length < 2) e.contactName = 'Please enter your name.';
      if (!isEmail(form.contactEmail)) e.contactEmail = 'Please enter a valid email.';
      if (!isPhone(form.contactPhone)) e.contactPhone = 'Please enter a valid phone number.';
    }
    if (step === 4) {
      if (!form.consent) e.consent = 'Consent is required to submit your request.';
    }
    return e;
  }, [form, step]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function goNext() {
    const e = stepErrors;
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error('Fix required fields', 'Please review the highlighted inputs before continuing.');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const e = stepErrors;
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error('Fix required fields', 'Please review the highlighted inputs before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await createRepairRequest(form);
      if (error) throw error;
      setCreated(data);
      toast.success('Booking confirmed', `Your request ${data.id} was created.`);
      setStep(5);
    } catch (err) {
      toast.error('Booking failed', err?.message || 'Unable to create request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fade-in-up">
      <div className="spread" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h1" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Book a Repair
          </h1>
          <p className="p">Complete a few steps and we’ll schedule your service.</p>
        </div>
        <Badge tone="blue">{STEPS[step]}</Badge>
      </div>

      <Card className="card-pad">
        <div className="stepper" aria-label="Booking steps">
          {STEPS.map((label, idx) => (
            <div
              key={label}
              className={`step-dot ${idx === step ? 'active' : ''} ${idx < step ? 'done' : ''}`}
              aria-label={`Step ${idx + 1}: ${label}`}
              aria-current={idx === step ? 'step' : undefined}
              title={label}
            >
              {idx < step ? '✓' : idx + 1}
            </div>
          ))}
        </div>

        {step === 0 ? (
          <div className="fade-in-up">
            <h2 className="h2">Choose your device</h2>
            <Select
              label="Device type"
              name="deviceType"
              value={form.deviceType}
              onChange={(e) => setField('deviceType', e.target.value)}
              error={errors.deviceType}
            >
              <option value="">Select one…</option>
              {DEVICE_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <div className="section row">
              <Button variant="primary" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="fade-in-up">
            <h2 className="h2">Describe the issue</h2>
            <Textarea
              label="Issue description"
              name="issueDescription"
              value={form.issueDescription}
              onChange={(e) => setField('issueDescription', e.target.value)}
              error={errors.issueDescription}
              placeholder="Example: Screen cracked, battery drains quickly, won't charge..."
            />
            <div className="section row">
              <Button variant="ghost" onClick={goBack}>
                Back
              </Button>
              <Button variant="primary" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="fade-in-up">
            <h2 className="h2">Pick a time</h2>
            <div className="grid-2">
              <Input
                label="Preferred date"
                name="preferredDate"
                type="date"
                value={form.preferredDate}
                onChange={(e) => setField('preferredDate', e.target.value)}
                error={errors.preferredDate}
              />
              <Input
                label="Preferred time"
                name="preferredTime"
                type="time"
                value={form.preferredTime}
                onChange={(e) => setField('preferredTime', e.target.value)}
                error={errors.preferredTime}
              />
            </div>
            <div className="section row">
              <Button variant="ghost" onClick={goBack}>
                Back
              </Button>
              <Button variant="primary" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="fade-in-up">
            <h2 className="h2">Your contact details</h2>
            <div className="grid-2">
              <Input
                label="Full name"
                name="contactName"
                value={form.contactName}
                onChange={(e) => setField('contactName', e.target.value)}
                error={errors.contactName}
                autoComplete="name"
              />
              <Input
                label="Email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={(e) => setField('contactEmail', e.target.value)}
                error={errors.contactEmail}
                autoComplete="email"
                inputMode="email"
              />
            </div>
            <Input
              label="Phone"
              name="contactPhone"
              value={form.contactPhone}
              onChange={(e) => setField('contactPhone', e.target.value)}
              error={errors.contactPhone}
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 010-0000"
            />
            <div className="section row">
              <Button variant="ghost" onClick={goBack} disabled={submitting}>
                Back
              </Button>
              <Button variant="primary" onClick={goNext} disabled={submitting}>
                Review
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="fade-in-up">
            <h2 className="h2">Confirm</h2>
            <p className="p" style={{ marginBottom: 12 }}>
              Please review your details and confirm consent to submit your request.
            </p>

            <Card className="card card-pad" style={{ background: 'rgba(255,255,255,0.75)' }}>
              <div className="grid-2">
                <div>
                  <div className="help">Device</div>
                  <div style={{ fontWeight: 900 }}>{form.deviceType || '—'}</div>
                </div>
                <div>
                  <div className="help">Preferred</div>
                  <div style={{ fontWeight: 900 }}>
                    {form.preferredDate || '—'} · {form.preferredTime || '—'}
                  </div>
                </div>
              </div>
              <div className="section">
                <div className="help">Issue</div>
                <div style={{ fontWeight: 800 }}>{form.issueDescription || '—'}</div>
              </div>
              <div className="section grid-2">
                <div>
                  <div className="help">Name</div>
                  <div style={{ fontWeight: 900 }}>{form.contactName || '—'}</div>
                </div>
                <div>
                  <div className="help">Email</div>
                  <div style={{ fontWeight: 900 }}>{form.contactEmail || '—'}</div>
                </div>
              </div>
              <div className="section">
                <div className="help">Phone</div>
                <div style={{ fontWeight: 900 }}>{form.contactPhone || '—'}</div>
              </div>

              <div className="section">
                <label className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.consent)}
                    onChange={(e) => setField('consent', e.target.checked)}
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={errors.consent ? 'consent-error' : undefined}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    <span style={{ fontWeight: 900 }}>I consent</span>
                    <span className="help" style={{ display: 'block' }}>
                      to be contacted regarding this repair request (phone/email).
                    </span>
                  </span>
                </label>
                {errors.consent ? (
                  <div id="consent-error" className="error" role="alert">
                    {errors.consent}
                  </div>
                ) : null}
              </div>
            </Card>

            <div className="section row">
              <Button variant="ghost" onClick={goBack} disabled={submitting}>
                Back
              </Button>
              <Button variant="primary" onClick={submit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="fade-in-up">
            <h2 className="h2">Success</h2>
            <p className="p">We’ve received your request. Our team will reach out shortly to confirm details.</p>

            <div className="section row">
              {created ? <Badge tone="green">Request ID: {created.id}</Badge> : null}
              <Badge tone="blue">Status: New</Badge>
            </div>

            <div className="section row">
              <Button
                variant="primary"
                onClick={() => {
                  setStep(0);
                  setCreated(null);
                  setErrors({});
                  setForm({
                    deviceType: '',
                    issueDescription: '',
                    preferredDate: '',
                    preferredTime: '',
                    contactName: '',
                    contactEmail: '',
                    contactPhone: '',
                    consent: false
                  });
                }}
              >
                Book another repair
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
