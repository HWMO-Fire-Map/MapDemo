import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';

function AppWithRouter() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={App} />
        <Route path="/data-information" component={DataInformationPage} />
      </Switch>
    </Router>
  );
}

export default AppWithRouter;