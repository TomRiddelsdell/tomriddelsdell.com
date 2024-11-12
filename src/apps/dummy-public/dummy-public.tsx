import { appConfig } from "../../AppConfig";

const DummyPublic = () => {
  return (
    <div className={appConfig('dummy-public')?.className}>
      <h1>App Two</h1>
      <p>This is the page for App Two.</p>
    </div>
  );
};

export default DummyPublic;