import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create Supabase client with service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // This should be added to your .env.local
);

export async function POST(request) {
  try {
    const formData = await request.json();
    
    // Server-side validation
    const requiredFields = [
      'delegateType', 'surname', 'firstName', 'institution', 
      'institutionAddress', 'institutionContact', 'institutionEmail', 
      'regionCluster', 'delegateContact', 'delegateEmail', 
      'age', 'tshirtSize', 'paymentOption'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Generate registration ID
    const registrationId = 'NRYLI2025-' + Date.now().toString().slice(-8);
    
    // Prepare data for database
    const registrationData = {
      delegate_type: formData.delegateType,
      surname: formData.surname,
      first_name: formData.firstName,
      middle_initial: formData.middleInitial || null,
      institution: formData.institution,
      institution_address: formData.institutionAddress,
      institution_contact: formData.institutionContact,
      institution_email: formData.institutionEmail,
      region_cluster: formData.regionCluster,
      delegate_contact: formData.delegateContact,
      delegate_email: formData.delegateEmail,
      age: parseInt(formData.age),
      tshirt_size: formData.tshirtSize,
      dietary_preferences: formData.dietaryPreferences || 'None',
      dietary_comments: formData.dietaryComments || null,
      payment_option: formData.paymentOption,
      payment_proof_url: formData.paymentProofUrl || null,
      transaction_ref: formData.transactionRef || null,
      registration_id: registrationId,
      status: 'pending'
    };
    
    // Insert data into Supabase
    const { data, error } = await supabaseAdmin
      .from('nryli_registrations')
      .insert([registrationData])
      .select();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save registration' },
        { status: 500 }
      );
    }
    
    // TODO: Send confirmation email here
    // You can use services like Resend, SendGrid, or Supabase Auth
    
    return NextResponse.json({
      success: true,
      registrationId: registrationId,
      data: data[0]
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Registration API is working' });
}