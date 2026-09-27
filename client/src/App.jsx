import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import Header from './components/Header';
import ReleaseList from './components/ReleaseList';
import ReleaseForm from './components/ReleaseForm';
import './App.css';

const client = new ApolloClient({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="app">
          <Header />
          <main className="main">
            <Routes>
              <Route path="/" element={<ReleaseList />} />
              <Route path="/release/:id" element={<ReleaseForm />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
