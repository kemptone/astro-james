import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { fan, state, endpoint } = await request.json();
    
    // Validate input
    if (!fan || !state || !endpoint) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: fan, state, endpoint' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (![1, 2, 3, 4].includes(fan)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid fan number. Must be 1, 2, 3, or 4' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['on', 'off'].includes(state)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid state. Must be "on" or "off"' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: Replace with actual WiFi plug API calls
    // This is where you would make HTTP requests to your WiFi-enabled plugs
    
    console.log(`[SRO11] Fan Control Request:`, {
      fan,
      state: state.toUpperCase(),
      endpoint,
      timestamp: new Date().toISOString()
    });

    // Placeholder for actual API calls to WiFi plugs
    // Example implementations for different plug types:
    
    // For TP-Link Kasa plugs:
    // const kasaResponse = await fetch(`http://${endpoint}/api/system`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     system: {
    //       set_relay_state: { state: state === 'on' ? 1 : 0 }
    //     }
    //   })
    // });

    // For Tasmota-based plugs:
    // const tasmotaResponse = await fetch(`http://${endpoint}/cm?cmnd=Power%20${state === 'on' ? 'On' : 'Off'}`, {
    //   method: 'GET'
    // });

    // For generic REST API plugs:
    // const genericResponse = await fetch(`http://${endpoint}/power`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ state })
    // });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      fan,
      state,
      endpoint,
      message: `Fan ${fan} set to ${state.toUpperCase()}`,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SRO11] Fan control error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET endpoint for checking fan status (future use)
export const GET: APIRoute = async ({ url }) => {
  const fan = url.searchParams.get('fan');
  
  if (!fan) {
    return new Response(JSON.stringify({ 
      error: 'Missing fan parameter' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // TODO: Implement actual status checking
  // This would query the WiFi plug to get its current state
  
  return new Response(JSON.stringify({
    fan: parseInt(fan),
    status: 'unknown',
    message: 'Status checking not implemented yet'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};