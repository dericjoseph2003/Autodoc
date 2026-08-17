import React, { useState } from 'react';
import { api } from '../../src/services/api';
import RegisterBusinessScreen from './RegisterBusinessScreen';
import VerifyBusinessScreen from './VerifyBusinessScreen';
import SubmittedForApprovalScreen from './SubmittedForApprovalScreen';

export default function ServiceCenterRegisterNavigator({ accountDetails, onCancel, onFinish }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    contactPersonName: '',
    businessName: '',
    businessType: '',
    servicesOffered: [],
    businessAddress: '',
    city: '',
    pincode: '',
    businessRegistrationNumber: '',
    operatingHours: '9:00 AM - 6:00 PM',
    businessLicense: null,
    mechanicCert: null
  });

  const handleStep1Continue = (step1Data) => {
    setFormData((prev) => ({ ...prev, ...step1Data }));
    setStep(2);
  };

  const handleStep2Back = (step2Data) => {
    // Keep entered step 2 data in state when user goes back
    setFormData((prev) => ({ ...prev, ...step2Data }));
    setStep(1);
  };

  const handleStep2Submit = async (step2Data) => {
    const updatedFormData = { ...formData, ...step2Data };
    setFormData(updatedFormData);

    // Prepare complete payload combining User Account details + Business Details
    const payload = {
      name: accountDetails.name,
      email: accountDetails.email,
      password: accountDetails.password,
      googleId: accountDetails.googleId || null,
      phone: accountDetails.phone,
      role: 'serviceCenter',
      contactPersonName: updatedFormData.contactPersonName,
      businessName: updatedFormData.businessName,
      businessAddress: updatedFormData.businessAddress,
      city: updatedFormData.city,
      pincode: updatedFormData.pincode,
      latitude: updatedFormData.latitude,
      longitude: updatedFormData.longitude,
      businessRegistrationNumber: updatedFormData.businessRegistrationNumber,
      servicesOffered: updatedFormData.servicesOffered,
      operatingHours: updatedFormData.operatingHours,
      businessDocumentUrl: '/uploads/mock_business_license.pdf'
    };

    // Call registration API
    const response = await api.register(payload);

    if (response.status === 'pending_approval') {
      // Transition to success screen
      setStep(3);
    } else {
      throw new Error(response.message || 'Registration failed.');
    }
  };

  switch (step) {
    case 1:
      return (
        <RegisterBusinessScreen
          formData={formData}
          onContinue={handleStep1Continue}
          onBack={onCancel}
        />
      );
    case 2:
      return (
        <VerifyBusinessScreen
          formData={formData}
          onBack={handleStep2Back}
          onSubmit={handleStep2Submit}
        />
      );
    case 3:
      return (
        <SubmittedForApprovalScreen
          onFinish={onFinish}
        />
      );
    default:
      return null;
  }
}
