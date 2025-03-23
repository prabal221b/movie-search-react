import React, {useEffect, useState} from 'react'
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";


const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
}

const App = () => {

    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

    const [errorMessage, setErrorMessage] = useState('')
    const [movieList, setMovieList] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const [trendingMovies, setTrendingMovies] = useState([])
    const [errorTrendingMessage, setErrorTrendingMessage] = useState('')


    useDebounce( () => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

    const fetchMovies = async ( query='' ) => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURI(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);
            if (!response.ok) {
                throw new Error('Failed to fetch movies');
            }

            const data = await response.json();
            if(data.Response === 'False'){
                setErrorMessage(data.Response || 'Failed to fetch movies');
                setMovieList([]);
                return;
            }
            if(data.results.length){
                setMovieList(data.results);
            } else{
                setErrorMessage('No Movies Found!');
            }


            if(query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }
        } catch(error){
            console.log(`error fetching movies: ${error}`)
            setErrorMessage('error fetching movies. Please try again later.')
        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async () => {
        try{
            const movies = await getTrendingMovies();
            if(movies.length  === 0){
                setErrorTrendingMessage('No trending movies found!');
                setTrendingMovies([]);
                return;
            }
            setTrendingMovies(movies);
        } catch (error) {
            console.log(error);
            setErrorTrendingMessage('error fetching trending movies. Please try again later.')
        }
    }

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    useEffect(() => {
        fetchMovies( debouncedSearchTerm );
    }, [debouncedSearchTerm]);

    return (
        <main>
            <div className="pattern" />
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner"/>
                    <h1>Find <span className="text-gradient">Movies </span>You'll Enjoy Without the Hassle!</h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {errorTrendingMessage ? (
                    <p className="text-red-500">{errorTrendingMessage}</p>) : (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title}/>
                                </li>
                            ))}
                        </ul>
                    </section>)}


                <section className="all-movies">
                    <h2>All Movies</h2>
                    {isLoading ? (
                        <Spinner/>
                        ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map( (movie) => {
                                return (
                                    <MovieCard key={movie.id} movie={movie}/>
                                )
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}
export default App
