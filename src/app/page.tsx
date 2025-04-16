'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Availability {
  day: string;
  time: string;
  status: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  availability: Availability[];
}

export default function Home() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('http://localhost:4000/doctors');
        setDoctors(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const getAvailableSlots = (availability: Availability[]) => {
    return availability.filter(slot => slot.status === 'available').length;
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">
        Available Doctors
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              {doctor.name}
            </h2>
            <p className="text-gray-600 mb-2">{doctor.specialization}</p>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-500">
                Available Slots:
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {getAvailableSlots(doctor.availability)}
              </span>
            </div>
            <Link
              href={`/doctors/${doctor.id}`}
              className="block text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Book Appointment
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}