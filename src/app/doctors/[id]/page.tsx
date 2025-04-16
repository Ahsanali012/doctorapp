'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';

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

interface ValidationErrors {
  [key: string]: string[];
}

export default function BookingPage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    civilId: '',
    preferredDate: '',
    preferredTime: '',
    alternativeDate: '',
    alternativeTime: '',
    appointmentType: 'consultation',
    medicalReason: '',
    medications: '',
    allergies: '',
    medicalHistory: ''
  });

  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        if (!id || isNaN(Number(id))) {
          setErrors(prev => ({ ...prev, doctorId: ['Invalid doctor ID'] }));
          return;
        }
        
        const response = await axios.get(`http://localhost:4000/doctors/${id}`);
        setDoctor(response.data);
      } catch (err) {
        setFormError('Failed to load doctor details');
      }
    };

    if (id) fetchDoctor();
  }, [id]);

  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    const civilIdRegex = /^[A-Za-z0-9-]{8,20}$/;
    const slotRegex = /^[A-Za-z]+ - (0[0-9]|1[0-2]):[0-5][0-9] [AP]M$/;

    // Personal Information Validation
    if (!formData.firstName.trim()) newErrors.firstName = ['First name is required'];
    else if (formData.firstName.length > 50) newErrors.firstName = ['Maximum 50 characters allowed'];

    if (!formData.lastName.trim()) newErrors.lastName = ['Last name is required'];
    else if (formData.lastName.length > 50) newErrors.lastName = ['Maximum 50 characters allowed'];

    if (!formData.dob) newErrors.dob = ['Date of birth is required'];
    if (!formData.gender) newErrors.gender = ['Gender is required'];
    if (!formData.phone.match(phoneRegex)) newErrors.phone = ['Invalid phone number'];
    if (!formData.email.match(emailRegex)) newErrors.email = ['Invalid email address'];
    if (!formData.civilId.match(civilIdRegex)) newErrors.civilId = ['Civil ID must be 8-20 alphanumeric characters'];

    // Appointment Details Validation
    if (!formData.preferredDate) newErrors.preferredDate = ['Preferred date is required'];
    if (!selectedSlot.match(slotRegex)) newErrors.preferredTime = ['Please select a valid time slot'];

    // Medical Information Validation
    if (!formData.medicalReason.trim()) newErrors.medicalReason = ['Reason for visit is required'];
    else if (formData.medicalReason.length > 500) newErrors.medicalReason = ['Maximum 500 characters allowed'];

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        doctorId: Number(id),
        patientName: `${formData.firstName} ${formData.lastName}`.trim(),
        slot: selectedSlot,
        ...formData,
        bookingDate: new Date().toISOString()
      };
    
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    
      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setFormError(data.error || 'Booking failed');
        }
        return;
      }
    
      // Navigate with appointment ID from response
      router.push(`/confirmation?appointmentId=${data.appointment.id}`);
      
    } catch (err) {
      setFormError('Failed to submit booking. Please try again.');
    }
  };

  if (formError) return <div className="p-4 text-red-500">{formError}</div>;
  if (!doctor) return <div className="p-4 text-center">Loading...</div>;

  const availableSlots = doctor.availability.filter(slot => slot.status === 'available');

  if (availableSlots.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Book Appointment with {doctor.name}
        </h1>
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
          No available time slots for this doctor. Please check back later.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Book Appointment with {doctor.name}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">1. Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                First Name*
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.firstName ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.firstName && (
                  <span className="text-red-500 text-sm">{errors.firstName[0]}</span>
                )}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Last Name*
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.lastName ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.lastName && (
                  <span className="text-red-500 text-sm">{errors.lastName[0]}</span>
                )}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Date of Birth*
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.dob ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.dob && (
                  <span className="text-red-500 text-sm">{errors.dob[0]}</span>
                )}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Gender*
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.gender ? 'border-red-500' : ''
                  }`}
                  required
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <span className="text-red-500 text-sm">{errors.gender[0]}</span>
                )}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Phone Number*
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.phone ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.phone && (
                  <span className="text-red-500 text-sm">{errors.phone[0]}</span>
                )}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Email*
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">{errors.email[0]}</span>
                )}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Civil ID*
                <input
                  name="civilId"
                  value={formData.civilId}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.civilId ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.civilId && (
                  <span className="text-red-500 text-sm">{errors.civilId[0]}</span>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">2. Appointment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Preferred Date*
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.preferredDate ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.preferredDate && (
                  <span className="text-red-500 text-sm">{errors.preferredDate[0]}</span>
                )}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Preferred Time*
                <select
                  name="preferredTime"
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.preferredTime ? 'border-red-500' : ''
                  }`}
                  required
                >
                  <option value="">Select Time</option>
                  {availableSlots.map((slot, index) => (
                    <option key={index} value={`${slot.day} - ${slot.time}`}>
                      {slot.day} - {slot.time}
                    </option>
                  ))}
                </select>
                {errors.preferredTime && (
                  <span className="text-red-500 text-sm">{errors.preferredTime[0]}</span>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">3. Medical Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Reason for Visit*
                <textarea
                  name="medicalReason"
                  value={formData.medicalReason}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md mt-1 ${
                    errors.medicalReason ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.medicalReason && (
                  <span className="text-red-500 text-sm">{errors.medicalReason[0]}</span>
                )}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Current Medications
                <input
                  type="text"
                  name="medications"
                  value={formData.medications}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md mt-1"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Allergies
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md mt-1"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Medical History
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md mt-1"
                />
              </label>
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">
            {formError}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors"
        >
          Submit Booking
        </button>
      </form>
    </div>
  );
}