/**
 * @jest-environment puppeteer
 */
import axios from 'axios';
import soartechProbes from '../__mocks__/dummySoartechResponses.json';
import alignmentIDs from '../components/TextBasedScenarios/alignmentID.json'

const ADEPT_URL = process.env.REACT_APP_ADEPT_URL;
const SOARTECH_URL = process.env.REACT_APP_SOARTECH_URL;
const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;


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
      `${SOARTECH_URL}/api/v1/response`,
      payload
    );
  }
};

describe('TA1 Server Tests', () => {
  // if these tests two fail, the others have no hope
  describe('Session Creation', () => {
    it('should create a new ADEPT session successfully', async () => {
      const response = await axios.post(`${ADEPT_URL}/api/v1/new_session`);

      // check response status and that the session id is returned
      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
    }, 10000);

    it('should create a new SoarTech session successfully', async () => {
      const response = await axios.post(
        `${SOARTECH_URL}/api/v1/new_session?user_id=default_user`
      );

      expect(response.status).toBe(201);
      expect(response.data).toBeTruthy();
    }, 10000);
  });

  describe('Response Submission', () => {
    if (!IS_PH1) {
      it('should submit responses to ADEPT server successfully', async () => {
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;

        // dummy probe response for adept
        const responsePayload = {
          response: {
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
          },
          session_id: sessionId
        };

        const response = await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          responsePayload
        );

        expect(response.status).toBe(200);
      });
    }
    it('should submit responses to SoarTech server successfully', async () => {
      const sessionResponse = await axios.post(`${SOARTECH_URL}/api/v1/new_session?user_id=default_user`);
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
        `${SOARTECH_URL}/api/v1/response`,
        responsePayload
      );

      expect(response.status).toBe(201);
    });
  });

  describe('KDMA Profile', () => {
    if (!IS_PH1) {
      it('should fetch adept KDMA profile successfully', async () => {
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;

        const responsePayload = {
          response: {
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
          },
          session_id: sessionId
        };

        // post probe response before calling kdma 
        await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          responsePayload
        );

        const response = await axios.get(
          `${ADEPT_URL}/api/v1/computed_kdma_profile`,
          { params: { session_id: sessionId } }
        );

        expect(response.status).toBe(200);
        expect(response.data).toBeTruthy();
      });
    }
    it('should fetch soartech KDMA profile successfully', async () => {
      const sessionResponse = await axios.post(`${SOARTECH_URL}/api/v1/new_session?user_id=default_user`);
      const sessionId = sessionResponse.data;

      const scenarioId = 'qol-ph1-eval-2';
      await submitSoartechProbes(sessionId, scenarioId);

      const response = await axios.get(
        `${SOARTECH_URL}/api/v1/computed_kdma_profile`,
        { params: { session_id: sessionId } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
    }, 40000);
  });

  describe('Ordered Alignment', () => {
    if (!IS_PH1) {
      it('should fetch adept ordered alignment data successfully', async () => {
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;

        const responsePayload = {
          response: {
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
          },
          session_id: sessionId
        };

        // post probe response before calling kdma 
        await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          responsePayload
        );

        const response = await axios.get(
          `${ADEPT_URL}/api/v1/get_ordered_alignment`,
          {
            params: {
              session_id: sessionId,
              kdma_id: IS_PH1 ? 'Moral judgement' : 'merit'
            }
          }
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBeTruthy();
      });
    }
    it('should fetch soartech ordered alignment data successfully', async () => {
      const sessionResponse = await axios.post(`${SOARTECH_URL}/api/v1/new_session?user_id=default_user`);
      const sessionId = sessionResponse.data;

      const scenarioId = 'qol-ph1-eval-2';
      await submitSoartechProbes(sessionId, scenarioId);

      const response = await axios.get(
        `${SOARTECH_URL}/api/v1/get_ordered_alignment`,
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
    }, 40000);
  });

  describe('Alignment Data', () => {
    // endpoint for adept is out dated and not used, so no test for adept here
    it('should fetch SoarTech alignment endpoint successfully', async () => {
      const sessionResponse = await axios.post(
        `${SOARTECH_URL}/api/v1/new_session?user_id=default_user`
      );
      const sessionId = sessionResponse.data;

      const scenarioId = 'qol-ph1-eval-2';
      await submitSoartechProbes(sessionId, scenarioId);

      // list of alignment targets for st qol
      const qolTargets = alignmentIDs['stQOL'];

      for (const target of qolTargets) {
        const response = await axios.get(
          `${SOARTECH_URL}/api/v1/alignment/session`,
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
    }, 40000);
  });


  describe('Full Workflow Test', () => {
    if (!IS_PH1) {
      it('should complete a full workflow with ADEPT server', async () => {
        // starts adept sessions, responds to probe, gets kdma, and calls ordered alignment
        // checks each step as we go
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;
        expect(sessionResponse.status).toBe(200);

        const responsePayload = {
          response: {
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
          },
          session_id: sessionId
        };

        const probeResponse = await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          responsePayload
        );
        expect(probeResponse.status).toBe(200);


        const kdmaResponse = await axios.get(
          `${ADEPT_URL}/api/v1/computed_kdma_profile`,
          { params: { session_id: sessionId } }
        );
        expect(kdmaResponse.status).toBe(200);

        const alignmentResponse = await axios.get(
          `${ADEPT_URL}/api/v1/get_ordered_alignment`,
          {
            params: {
              session_id: sessionId,
              kdma_id: IS_PH1 ? 'Moral judgement' : 'merit'
            }
          }
        );
        expect(alignmentResponse.status).toBe(200);
      });
    }

    it('should complete a full workflow with SoarTech server', async () => {
      // starts soartech session, responds to probe, calls kdma endpoint, calls ordered alignment endpoint
      const sessionResponse = await axios.post(
        `${SOARTECH_URL}/api/v1/new_session?user_id=default_user`
      );
      const sessionId = sessionResponse.data;
      expect(sessionResponse.status).toBe(201);

      const scenarioId = 'qol-ph1-eval-2';
      await submitSoartechProbes(sessionId, scenarioId);

      // Get KDMA profile
      const kdmaResponse = await axios.get(
        `${SOARTECH_URL}/api/v1/computed_kdma_profile`,
        { params: { session_id: sessionId } }
      );
      expect(kdmaResponse.status).toBe(200);

      const alignmentResponse = await axios.get(
        `${SOARTECH_URL}/api/v1/get_ordered_alignment`,
        {
          params: {
            session_id: sessionId,
            kdma_id: 'QualityOfLife'
          }
        }
      );
      expect(alignmentResponse.status).toBe(200);
    }, 40000);
  });

  describe('Comparing Two Sessions', () => {
    it('Should compare two soartech sessions using /subset endpoint', async () => {

      const sessionResponse1 = await axios.post(
        `${SOARTECH_URL}/api/v1/new_session?user_id=default_user`
      );
      const sessionId1 = sessionResponse1.data;
      expect(sessionResponse1.status).toBe(201);

      const sessionResponse2 = await axios.post(
        `${SOARTECH_URL}/api/v1/new_session?user_id=default_user`
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
        `${SOARTECH_URL}/api/v1/alignment/session/subset`,
        { params }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
    }, 40000);
    if (!IS_PH1) {
      it('Should compare two adept sessions using /compare_sessions', async () => {
        // start sessions
        const sessionResponse1 = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId1 = sessionResponse1.data;
        expect(sessionResponse1.status).toBe(200);

        const sessionResponse2 = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId2 = sessionResponse2.data;
        expect(sessionResponse2.status).toBe(200);

        // dummy probe responses
        const responsePayload = {
          response: {
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
          }
        };

        // submit dummy probe response for each session
        await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          { ...responsePayload, session_id: sessionId1 }
        );

        await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          { ...responsePayload, session_id: sessionId2 }
        );

        const response = await axios.get(
          `${ADEPT_URL}/api/v1/alignment/compare_sessions`,
          {
            params: {
              session_id_1: sessionId1,
              session_id_2: sessionId2,
            }
          }
        );
        expect(response.status).toBe(200);
        expect(response.data).toBeTruthy();
      });
    }
  });
});
