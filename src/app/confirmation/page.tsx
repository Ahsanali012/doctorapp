'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Appointment {
  id: string;
  patientName: string;
  timeSlot: string;
  doctorId: number;
  date: string;
  medicalReason: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const appointmentId = searchParams.get('appointmentId');

  console.log("Appointment ID",appointmentId);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        if (!appointmentId) return;

        // Fetch appointment details
        const appointmentRes = await fetch(
          `http://localhost:4000/appointments/${appointmentId}`
        );
        
        if (!appointmentRes.ok) {
          throw new Error('Failed to fetch appointment details');
        }

        const appointmentData: Appointment = await appointmentRes.json();
        setAppointment(appointmentData);

        // Fetch doctor details using appointment's doctorId
        const doctorRes = await fetch(
          `http://localhost:4000/doctors/${appointmentData.doctorId}`
        );
        
        if (!doctorRes.ok) {
          throw new Error('Failed to fetch doctor details');
        }

        const doctorData: Doctor = await doctorRes.json();
        setDoctor(doctorData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" />
          <p className="mt-4 text-gray-600">Loading confirmation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4 text-gray-800">Error occurred</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="text-blue-600 hover:underline"
          >
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-green-500 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h1 className="text-2xl font-bold mt-4 text-gray-800">
            Booking Confirmed!
          </h1>
        </div>

        {appointment && doctor && (
          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              <span className="font-semibold">Doctor:</span> {doctor.name}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Specialization:</span>{" "}
              {doctor.specialization}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Patient Name:</span>{" "}
              {appointment.patientName}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Appointment Date:</span>{" "}
              {new Date(appointment.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Time Slot:</span>{" "}
              {appointment.timeSlot}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Reason:</span>{" "}
              {appointment.medicalReason}
            </p>
          </div>
        )}

        <div className="mt-6 border-t pt-6">
          <Link
            href="/"
            className="block text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}