import axios from 'axios';
import soartechProbes from './dummySoartechResponses.json';
import alignmentIDs from '../components/TextBasedScenarios/alignmentID.json'
// Note: soartech has a mix of 201 or 200 being success codes, hence different expect statements

const submitSoartechProbes = async (sessionId, scenarioId) => {
  const probes = soartechProbes[scenarioId];

  for (const probe of probes) {
    const payload = {
      response: {
        ...probe,
        scenario_id: scenarioId
      },
      session_id: sessionId
    };

    await axios.post(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/response`,
      payload
    );
  }
};

describe('TA1 Server Tests', () => {
  // if these tests two fail, the others have no hope
  describe('Session Creation', () => {
    it('should create a new ADEPT session successfully', async () => {
      const response = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);

      // check response status and that the session id is returned
      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
    });

    it('should create a new SoarTech session successfully', async () => {
      const response = await axios.post(
        `${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`
      );

      expect(response.status).toBe(201);
      expect(response.data).toBeTruthy();
    });
  });

  describe('Response Submission', () => {
    it('should submit responses to ADEPT server successfully', async () => {
      const sessionResponse = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);
      const sessionId = sessionResponse.data;

      // dummy probe response for adept
      const responsePayload = {
        response: {
          choice: 'Response 2B',
          justification: 'justification',
          probe_id: 'Probe 2',
          scenario_id: 'DryRunEval-MJ2-eval',
        },
        session_id: sessionId
      };

      const response = await axios.post(
        `${process.env.REACT_APP_ADEPT_URL}/api/v1/response`,
        responsePayload
      );

      expect(response.status).toBe(200);
    });
    it('should submit responses to SoarTech server successfully', async () => {
      const sessionResponse = await axios.post(`${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`);
      const sessionId = sessionResponse.data;

      // dummy probe response for st
      const responsePayload = {
        "response": {
          "choice": 'choice-0',
          "justification": 'justification',
          "probe_id": 'qol-ph1-eval-2-Probe-1',
          "scenario_id": 'qol-ph1-eval-2',
        },
        "session_id": sessionId
      };

      const response = await axios.post(
        `${process.env.REACT_APP_SOARTECH_URL}/api/v1/response`,
        responsePayload
      );

      expect(response.status).toBe(201);
    });
  });
});

describe('KDMA Profile', () => {
  it('should fetch adept KDMA profile successfully', async () => {
    const sessionResponse = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);
    const sessionId = sessionResponse.data;

    const responsePayload = {
      response: {
        choice: 'Response 2B',
        justification: 'justification',
        probe_id: 'Probe 2',
        scenario_id: 'DryRunEval-MJ2-eval',
      },
      session_id: sessionId
    };

    // post probe response before calling kdma 
    await axios.post(
      `${process.env.REACT_APP_ADEPT_URL}/api/v1/response`,
      responsePayload
    );

    const response = await axios.get(
      `${process.env.REACT_APP_ADEPT_URL}/api/v1/computed_kdma_profile`,
      { params: { session_id: sessionId } }
    );

    expect(response.status).toBe(200);
    expect(response.data).toBeTruthy();
  });
  it('should fetch soartech KDMA profile successfully', async () => {
    const sessionResponse = await axios.post(`${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`);
    const sessionId = sessionResponse.data;

    const scenarioId = 'qol-ph1-eval-2';
    await submitSoartechProbes(sessionId, scenarioId);

    const response = await axios.get(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/computed_kdma_profile`,
      { params: { session_id: sessionId } }
    );

    expect(response.status).toBe(200);
    expect(response.data).toBeTruthy();
  }, 20000);
});

describe('Ordered Alignment', () => {
  it('should fetch adept ordered alignment data successfully', async () => {
    const sessionResponse = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);
    const sessionId = sessionResponse.data;

    const responsePayload = {
      response: {
        choice: 'Response 2B',
        justification: 'justification',
        probe_id: 'Probe 2',
        scenario_id: 'DryRunEval-MJ2-eval',
      },
      session_id: sessionId
    };

    // post probe response before calling kdma 
    await axios.post(
      `${process.env.REACT_APP_ADEPT_URL}/api/v1/response`,
      responsePayload
    );

    const response = await axios.get(
      `${process.env.REACT_APP_ADEPT_URL}/api/v1/get_ordered_alignment`,
      {
        params: {
          session_id: sessionId,
          kdma_id: 'Moral judgement'
        }
      }
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBeTruthy();
  });
  it('should fetch soartech ordered alignment data successfully', async () => {
    const sessionResponse = await axios.post(`${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`);
    const sessionId = sessionResponse.data;

    const scenarioId = 'qol-ph1-eval-2';
    await submitSoartechProbes(sessionId, scenarioId);

    const response = await axios.get(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/get_ordered_alignment`,
      {
        params: {
          session_id: sessionId,
          kdma_id: 'QualityOfLife'
        }
      }
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBeTruthy();
    // needed longer timeout (took me about 17 seconds, may need to be messed with if failing for other people)
  }, 20000);
});

describe('Alignment Data', () => {
  // endpoint for adept is out dated and not used, so no test for adept here
  it('should fetch SoarTech alignment endpoint successfully', async () => {
    const sessionResponse = await axios.post(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`
    );
    const sessionId = sessionResponse.data;

    const scenarioId = 'qol-ph1-eval-2';
    await submitSoartechProbes(sessionId, scenarioId);

    // list of alignment targets for st qol
    const qolTargets = alignmentIDs['stQOL'];

    for (const target of qolTargets) {
      const response = await axios.get(
        `${process.env.REACT_APP_SOARTECH_URL}/api/v1/alignment/session`,
        {
          params: {
            session_id: sessionId,
            target_id: target
          }
        }
      );
      // check each target being called is successful
      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
    }
  }, 20000);
});


describe('Full Workflow Test', () => {
  it('should complete a full workflow with ADEPT server', async () => {
    // starts adept sessions, responds to probe, gets kdma, and calls ordered alignment
    // checks each step as we go
    const sessionResponse = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);
    const sessionId = sessionResponse.data;
    expect(sessionResponse.status).toBe(200);

    const responsePayload = {
      response: {
        choice: 'Response 2B',
        justification: 'justification',
        probe_id: 'Probe 2',
        scenario_id: 'DryRunEval-MJ2-eval',
      },
      session_id: sessionId
    };

    const probeResponse = await axios.post(
      `${process.env.REACT_APP_ADEPT_URL}/api/v1/response`,
      responsePayload
    );
    expect(probeResponse.status).toBe(200);


    const kdmaResponse = await axios.get(
      `${process.env.REACT_APP_ADEPT_URL}/api/v1/computed_kdma_profile`,
      { params: { session_id: sessionId } }
    );
    expect(kdmaResponse.status).toBe(200);

    const alignmentResponse = await axios.get(
      `${process.env.REACT_APP_ADEPT_URL}/api/v1/get_ordered_alignment`,
      {
        params: {
          session_id: sessionId,
          kdma_id: 'Moral judgement'
        }
      }
    );
    expect(alignmentResponse.status).toBe(200);
  });

  it('should complete a full workflow with SoarTech server', async () => {
    // starts soartech session, responds to probe, calls kdma endpoint, calls ordered alignment endpoint
    const sessionResponse = await axios.post(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`
    );
    const sessionId = sessionResponse.data;
    expect(sessionResponse.status).toBe(201);

    const scenarioId = 'qol-ph1-eval-2';
    await submitSoartechProbes(sessionId, scenarioId);

    // Get KDMA profile
    const kdmaResponse = await axios.get(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/computed_kdma_profile`,
      { params: { session_id: sessionId } }
    );
    expect(kdmaResponse.status).toBe(200);

    const alignmentResponse = await axios.get(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/get_ordered_alignment`,
      {
        params: {
          session_id: sessionId,
          kdma_id: 'QualityOfLife'
        }
      }
    );
    expect(alignmentResponse.status).toBe(200);
  }, 20000);
});

describe('Comparing Two Sessions', () => {
  it('Should compare two soartech sessions using /subset endpoint', async () => {

    const sessionResponse1 = await axios.post(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`
    );
    const sessionId1 = sessionResponse1.data;
    expect(sessionResponse1.status).toBe(201);
    
    const sessionResponse2 = await axios.post(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`
    );
    const sessionId2 = sessionResponse2.data;
    expect(sessionResponse2.status).toBe(201);

    // submit probes for both sessions
    const scenarioId = 'qol-ph1-eval-2';
    await submitSoartechProbes(sessionId1, scenarioId);
    await submitSoartechProbes(sessionId2, scenarioId);

    const allProbeIds = soartechProbes[scenarioId].map(probe => probe.probe_id);

    // I had to use this weirder approach because I was getting CORS error for some reason
    const params = new URLSearchParams();
    params.append('session_1', sessionId1);
    params.append('session_2', sessionId2);
    allProbeIds.forEach(probeId => {
      params.append('session1_probes', probeId);
      params.append('session2_probes', probeId);
    });

    // compare both sessions
    const response = await axios.get(
      `${process.env.REACT_APP_SOARTECH_URL}/api/v1/alignment/session/subset`,
      { params }
    );

    console.log(response)
    expect(response.status).toBe(200);
    expect(response.data).toBeTruthy();
  }, 20000);
});
