
import { useEffect, useState } from 'react';
import { authenticate, getUserMe } from './utils/genesysCloudUtils';
import CustomSkills from './components/custom-skills/CustomSkills';
import { Models } from 'purecloud-platform-client-v2';

function App() {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [authenticatedUser, setAuthenticadUser] = useState<Models.User>({version: 1})

  useEffect(() => {
    getPlatformClientData();
  }, []);

  async function getPlatformClientData() {
    await authenticate()
      .then(() => {
        return getUserMe();
      })
      .then((userDetailsResponse: any) => {
        setAuthenticadUser(userDetailsResponse)
        setInitialized(true)
      })
      .catch((err: any) => {
        console.error(err);
      });
  }

  

 

  return (
    <>{
      initialized && 
      <CustomSkills authenticatedUser={authenticatedUser}/>

      }
    </>
  );
}

export default App;
