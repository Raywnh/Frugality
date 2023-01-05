import './App.css';
import Menubar from './components/Menubar';
import Form from './components/Form';
import Login from './Login';
import Register from './Register';
import { useState, useRef, useEffect } from 'react';
import {v4 as uuidv4} from "uuid"
import {BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import {createUserWithEmailAndPassword, onAuthStateChanged, signOut, signInWithEmailAndPassword} from 'firebase/auth'
import {auth} from "./firebase-config"

function App() {
  const [totalBudget, setTotalBudget] = useState(0)
  const [currentBudget, setCurrentBudget] = useState(0)
  const inputRefBudget = useRef()

  const [items, setItems] = useState([])
  const inputRefName = useRef()
  const inputRefPrice = useRef()

  const [editItems, setEditItems] = useState(null)

  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [user, setUser] = useState("")
  const [loggedIn, setLoggedIn] = useState(false)

  // ENDPOINTS: 
  //   - GET REQUEST ON LOGIN + ON MOUNT CHECK FOR IF LOGGED IN -> YES --> GET REQUEST USER DATA AND SAVED ITEMS
  //   - POST REQUEST ON CREATING NEW ITEM (ONLY AFTER LOGGED IN) AND BUDGET
  //   - PUT REQUEST ON UPDATING FIELDS (UPDATING ITEMS) AND (BUDGET???)
  //   - DELETE REQUEST ON DELETING AN ITEM
  
  // EXTRA: DELETE ACCOUNT --> DELETE REQUEST (ALSO DELETE ON FIREBASE)


  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    if (loggedIn) {
      fetch('/items/' + loginEmail
      ).then((res) => res.json()
      ).then ((data) => setItems(data))
    }
    
  }, [loggedIn])

  useEffect(() => {
    const priceLost = [...items].reduce((accumulator, start) => accumulator - parseInt(start.price), parseInt(currentBudget))
    setTotalBudget(priceLost)
    
  },[items, currentBudget])
  
  return (
      <Router>
        <div className="App">
        <Menubar user={user} logout={logout} loggedIn={loggedIn}/>
        <Routes>
            <Route path= "/" element={
              <Form items={items} setItems={setItems} onNameSubmit={onNameSubmit} inputRefPrice={inputRefPrice} inputRefName={inputRefName} 
                    deleteComponent={deleteComponent} totalBudget={totalBudget} editComponent={editComponent} onBudgetSubmit={onBudgetSubmit}
                    inputRefBudget={inputRefBudget}/>}/>
            <Route path="/login" element={<Login setLoginEmail={setLoginEmail} setLoginPassword={setLoginPassword} login={login}/>}/>
            <Route path="/register" element={<Register setRegisterEmail={setRegisterEmail} setRegisterPassword={setRegisterPassword} register={register} />}/>
        </Routes>
        </div>
      </Router>
  )
  
  async function register() {
    try {
      await createUserWithEmailAndPassword(auth, registerEmail, registerPassword) 
      console.log("Successfully Registered")

      // POST REQUEST: creating new account
      fetch("/users",{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: registerEmail
        })
      }).then (
        res => {return res.json()}
      ).catch (
        error => console.log(error)
      )

      setRegisterEmail("")
      setRegisterPassword("")

    } catch (error) {
      console.log(error)
    }
  }
  
  async function login() {
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword) 
      setLoggedIn(true)
    } catch (error) {
      console.log(error.message)
    }

  }

  async function logout() {
    await signOut(auth)
    setLoggedIn(false)
    setLoginEmail("")
    setLoginPassword("")

    console.log("User has signed out")
  }

  function onBudgetSubmit() {
    const budget = inputRefBudget.current.value
    if (budget === '' || isNaN(budget)) return

    setCurrentBudget(budget)
    setTotalBudget(budget)
  }
  function onNameSubmit() {
    const name = inputRefName.current.value
    const price = inputRefPrice.current.value

    if (name === '' || isNaN(price) || price === '') return

    if(!editItems) {
      const newId = uuidv4()
      setItems(item => {return [...item, {id: newId, name: name, price: price, belongsTo: loginEmail}]})
      
      // POST REQUEST: creating item
      if (loggedIn) {
        fetch('/items/' + loginEmail, {
          method: "POST",
          body: JSON.stringify({
            belongsTo: loginEmail,
            id: newId,
            name: name,
            price: price
          }),
          headers: {
            'Content-type': 'application/json'
          }
        }).then((res) => res.json())
      }
    } else {
      updateItems(name, editItems.id, price)
    }
   
    inputRefName.current.value = null
    inputRefPrice.current.value = null
  }

  function deleteComponent(id) {
    const newItems = items.filter((item) => item.id !== id)
   
    setItems(newItems)
  }

  function editComponent(id) {
    const componentToEdit = items.find((item) => item.id === id)
    setEditItems(componentToEdit)
  }

  function updateItems(name, id, price) {
    const newItems = items.map((item) => item.id === id ? {name, id, price, belongsTo: loginEmail} : item)
    setItems(newItems)
    setEditItems("")
  }
}

export default App;
