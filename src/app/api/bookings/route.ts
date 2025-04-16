import { NextResponse } from 'next/server';

interface Slot {
  day: string;
  time: string;
  status: 'available' | 'booked';
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  availability: Slot[];
}

interface Appointment {
  id?: number;
  doctorId: number;
  patientName: string;
  timeSlot: string;
  date: string;
  status: string;
  medicalReason: string;
  medications: string;
  allergies: string;
  medicalHistory: string;
}

const SLOT_REGEX = /^[A-Za-z\s]+ - (0[0-9]|1[0-2]):[0-5][0-9] [AP]M$/;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;
const MAX_MEDICAL_REASON = 500;

export async function POST(request: Request) {
  try {
    console.log('[APPOINTMENT] Starting appointment creation process');
    
    // Parse and log request body
    const body = await request.json();
    console.log('[APPOINTMENT] Received request body:', JSON.stringify(body, null, 2));

    // Validate request
    const validationErrors: string[] = [];
    if (!Number.isInteger(body?.doctorId)) {
      validationErrors.push('Invalid doctor ID format');
    }

    if (typeof body?.patientName !== 'string' || 
        body.patientName.trim().length < MIN_NAME_LENGTH ||
        body.patientName.trim().length > MAX_NAME_LENGTH) {
      validationErrors.push(`Patient name must be ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters`);
    }

    if (!SLOT_REGEX.test(body?.slot)) {
      validationErrors.push('Invalid time slot format (expected "Day - HH:MM AM/PM")');
    }

    if (!body.medicalReason || body.medicalReason.trim().length === 0) {
      validationErrors.push('Medical reason is required');
    } else if (body.medicalReason.length > MAX_MEDICAL_REASON) {
      validationErrors.push(`Medical reason exceeds ${MAX_MEDICAL_REASON} characters`);
    }

    if (validationErrors.length > 0) {
      console.error('[VALIDATION] Validation errors:', validationErrors);
      return NextResponse.json({ errors: validationErrors }, { status: 400 });
    }

    // Sanitize data
    const sanitizedData = {
      doctorId: Number(body.doctorId),
      patientName: body.patientName.trim(),
      slot: body.slot.trim(),
      medicalReason: (body.medicalReason || '').trim(),
      medications: (body.medications || '').trim(),
      allergies: (body.allergies || '').trim(),
      medicalHistory: (body.medicalHistory || '').trim()
    };
    console.log('[SANITIZATION] Sanitized data:', JSON.stringify(sanitizedData, null, 2));

    // Fetch doctor details
    const doctorUrl = `http://localhost:4000/doctors/${sanitizedData.doctorId}`;
    console.log('[DOCTOR] Fetching doctor from:', doctorUrl);
    
    const doctorRes = await fetch(doctorUrl);
    if (!doctorRes.ok) {
      const errorText = await doctorRes.text();
      console.error(`[DOCTOR] Fetch failed. Status: ${doctorRes.status}, Response: ${errorText}`);
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const doctor: Doctor = await doctorRes.json();
    console.log('[DOCTOR] Found doctor:', JSON.stringify(doctor, null, 2));

    // Verify slot availability
    const selectedSlot = doctor.availability.find(slot => 
      `${slot.day} - ${slot.time}` === sanitizedData.slot
    );

    console.log('[SLOT] Available slots:', JSON.stringify(doctor.availability, null, 2));
    console.log('[SLOT] Looking for slot:', sanitizedData.slot);
    
    if (!selectedSlot) {
      console.error('[SLOT] Specified slot not found in doctor availability');
      return NextResponse.json({ error: 'Specified time slot not found' }, { status: 404 });
    }

    if (selectedSlot.status !== 'available') {
      console.error('[SLOT] Slot status conflict. Current status:', selectedSlot.status);
      return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 });
    }

    // Update doctor availability
    const updatedAvailability = doctor.availability.map(slot => 
      `${slot.day} - ${slot.time}` === sanitizedData.slot
        ? { ...slot, status: 'booked' }
        : slot
    );

    console.log('[DOCTOR] Updating availability to:', JSON.stringify(updatedAvailability, null, 2));
    const updateRes = await fetch(`http://localhost:4000/doctors/${sanitizedData.doctorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability: updatedAvailability }),
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error(`[DOCTOR] Update failed. Status: ${updateRes.status}, Error: ${errorText}`);
      return NextResponse.json({ error: 'Failed to reserve time slot' }, { status: 500 });
    }
    console.log('[DOCTOR] Availability updated successfully');

    // Create appointment
    const newAppointment: Omit<Appointment, 'id'> = {
      doctorId: sanitizedData.doctorId,
      patientName: sanitizedData.patientName,
      timeSlot: sanitizedData.slot,
      date: new Date().toISOString(),
      status: 'confirmed',
      medicalReason: sanitizedData.medicalReason,
      medications: sanitizedData.medications,
      allergies: sanitizedData.allergies,
      medicalHistory: sanitizedData.medicalHistory
    };

    console.log('[APPOINTMENT] Creating new appointment:', JSON.stringify(newAppointment, null, 2));
    const appointmentRes = await fetch('http://localhost:4000/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAppointment),
    });

    if (!appointmentRes.ok) {
      const errorText = await appointmentRes.text();
      console.error(`[APPOINTMENT] Creation failed. Status: ${appointmentRes.status}, Error: ${errorText}`);
      
      // Attempt rollback
      console.log('[ROLLBACK] Starting availability rollback...');
      const rollbackRes = await fetch(`http://localhost:4000/doctors/${sanitizedData.doctorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: doctor.availability }),
      });

      if (!rollbackRes.ok) {
        const rollbackError = await rollbackRes.text();
        console.error(`[ROLLBACK] Failed. Status: ${rollbackRes.status}, Error: ${rollbackError}`);
      } else {
        console.log('[ROLLBACK] Successfully reverted doctor availability');
      }
      
      return NextResponse.json({ error: 'Appointment creation failed' }, { status: 500 });
    }

    const createdAppointment = await appointmentRes.json();
    console.log('[APPOINTMENT] Successfully created:', JSON.stringify(createdAppointment, null, 2));
    
    return NextResponse.json({
      success: true,
      appointment: createdAppointment,
      message: 'Appointment booked successfully'
    });

  } catch (error) {
    console.error('[UNEXPECTED ERROR]', error);
    if (error instanceof Error) {
      console.error('[ERROR STACK]', error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error - please try again later' },
      { status: 500 }
    );
  }
}