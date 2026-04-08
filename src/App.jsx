import { useEffect, useState } from "react";
import api from "./api";

const getApiErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || fallbackMessage;
};

function App() {
  const [tab, setTab] = useState("student");
  const [authMode, setAuthMode] = useState("login");
  const [registerRole, setRegisterRole] = useState("student");
  const [currentUser, setCurrentUser] = useState(null);
  const [authForm, setAuthForm] = useState({
    fullName: "",
    email: "",
    password: "",
    interests: "",
    skills: "",
    expertise: "",
    careerPath: ""
  });
  const [resources, setResources] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCounsellor, setSelectedCounsellor] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [mode, setMode] = useState("ONLINE");
  const [studentSessions, setStudentSessions] = useState([]);
  const [engagement, setEngagement] = useState(null);
  const [adminStudents, setAdminStudents] = useState([]);
  const [adminCounsellors, setAdminCounsellors] = useState([]);
  const [counsellorSessions, setCounsellorSessions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [newResource, setNewResource] = useState({
    title: "",
    careerPath: "",
    description: "",
    link: ""
  });

  const fetchBase = async (authUser = currentUser) => {
    try {
      setErrorMessage("");
      const [res1, res2, res3] = await Promise.all([
        api.get("/public/resources"),
        api.get("/public/counsellors"),
        api.get("/user/students")
      ]);
      setResources(res1.data);
      setCounsellors(res2.data);
      setStudents(res3.data);
      if (authUser?.role === "STUDENT") {
        setSelectedStudent(authUser.id);
      } else if (res3.data.length > 0) {
        setSelectedStudent(res3.data[0].id);
      }
      if (res2.data.length > 0) {
        setSelectedCounsellor(res2.data[0].id);
      }
      if (authUser?.role === "ADMIN") {
        await loadAdminPeople();
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Could not load data from backend. Confirm backend is running on http://localhost:8080 and refresh."));
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBase();
    }
  }, []);

  const loadStudentSessions = async () => {
    if (!selectedStudent) return;
    const res = await api.get(`/user/sessions/${selectedStudent}`);
    setStudentSessions(res.data);
  };

  useEffect(() => {
    if (currentUser && currentUser.role === "STUDENT") {
      loadStudentSessions();
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (currentUser?.role === "STUDENT") {
      setTab("student");
    } else if (currentUser?.role === "ADMIN") {
      setTab("admin");
    } else if (currentUser?.role === "COUNSELLOR") {
      setTab("counsellor");
    }
  }, [currentUser]);

  const bookSession = async (e) => {
    e.preventDefault();
    try {
      setErrorMessage("");
      await api.post("/user/sessions", {
        studentId: Number(selectedStudent),
        counsellorId: Number(selectedCounsellor),
        sessionTime: new Date(sessionTime).toISOString().slice(0, 19),
        mode
      });
      await loadStudentSessions();
      alert("Session booked successfully.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Session booking failed. Check form values and backend connection."));
    }
  };

  const loadEngagement = async () => {
    const res = await api.get("/admin/engagement");
    setEngagement(res.data);
  };

  const loadAdminPeople = async () => {
    const [studentsRes, counsellorsRes] = await Promise.all([
      api.get("/admin/students"),
      api.get("/admin/counsellors")
    ]);
    setAdminStudents(studentsRes.data);
    setAdminCounsellors(counsellorsRes.data);
  };

  const loadCounsellorSessions = async (counsellorId = currentUser?.id) => {
    if (!counsellorId) return;
    const res = await api.get(`/counsellor/sessions/${counsellorId}`);
    setCounsellorSessions(res.data);
  };

  const addResource = async (e) => {
    e.preventDefault();
    await api.post("/admin/resources", newResource);
    setNewResource({ title: "", careerPath: "", description: "", link: "" });
    const res = await api.get("/admin/resources");
    setResources(res.data);
  };

  const deleteStudent = async (id) => {
    await api.delete(`/admin/students/${id}`);
    await loadAdminPeople();
    await loadEngagement();
  };

  const deleteCounsellor = async (id) => {
    await api.delete(`/admin/counsellors/${id}`);
    await loadAdminPeople();
    await loadEngagement();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setErrorMessage("");
      const res = await api.post("/auth/login", {
        email: authForm.email,
        password: authForm.password
      });
      setCurrentUser(res.data);
      if (res.data.role === "STUDENT") {
        setSelectedStudent(res.data.id);
      } else if (res.data.role === "COUNSELLOR") {
        await loadCounsellorSessions(res.data.id);
      }
      await fetchBase(res.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Login failed. Check your email and password."));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setErrorMessage("");
      await api.post(`/auth/register/${registerRole}`, authForm);
      setAuthMode("login");
      setAuthForm({
        fullName: "",
        email: "",
        password: "",
        interests: "",
        skills: "",
        expertise: "",
        careerPath: ""
      });
      alert("Registration successful. Please login.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Registration failed. Check your values and try again."));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setResources([]);
    setCounsellors([]);
    setStudents([]);
    setStudentSessions([]);
    setAdminStudents([]);
    setAdminCounsellors([]);
    setCounsellorSessions([]);
    setErrorMessage("");
  };

  if (!currentUser) {
    return (
      <div className="container">
        <h1>Career Advice & Mentorship Platform</h1>
        <p className="sub">Login or register as Student, Admin, or Counsellor.</p>
        {errorMessage && <p className="error">{errorMessage}</p>}

        <div className="tabs">
          <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
            Login
          </button>
          <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>
            Register
          </button>
        </div>

        {authMode === "login" && (
          <section className="card auth-card">
            <form onSubmit={handleLogin} className="form">
              <input
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
              <button type="submit">Login</button>
            </form>
            <p className="hint">Seed logins: student1@example.com / student123, admin@example.com / admin123</p>
          </section>
        )}

        {authMode === "register" && (
          <section className="card auth-card">
            <form onSubmit={handleRegister} className="form">
              <select value={registerRole} onChange={(e) => setRegisterRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
                <option value="counsellor">Counsellor</option>
              </select>

              <input
                placeholder="Full Name"
                value={authForm.fullName}
                onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />

              {registerRole !== "counsellor" && (
                <>
                  <input
                    placeholder="Interests"
                    value={authForm.interests}
                    onChange={(e) => setAuthForm({ ...authForm, interests: e.target.value })}
                  />
                  <input
                    placeholder="Skills"
                    value={authForm.skills}
                    onChange={(e) => setAuthForm({ ...authForm, skills: e.target.value })}
                  />
                </>
              )}

              {registerRole === "counsellor" && (
                <>
                  <input
                    placeholder="Expertise"
                    value={authForm.expertise}
                    onChange={(e) => setAuthForm({ ...authForm, expertise: e.target.value })}
                  />
                  <input
                    placeholder="Career Path (e.g., Data Science)"
                    value={authForm.careerPath}
                    onChange={(e) => setAuthForm({ ...authForm, careerPath: e.target.value })}
                    required
                  />
                </>
              )}

              <button type="submit">Create Account</button>
            </form>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Career Advice & Mentorship Platform</h1>
      <p className="sub">Explore career paths, book counselling, and track engagement.</p>
      <div className="topbar">
        <p>
          Logged in as <b>{currentUser.fullName}</b> ({currentUser.role})
        </p>
        <button onClick={logout}>Logout</button>
      </div>
      {errorMessage && <p className="error">{errorMessage}</p>}

      <div className="tabs">
        {currentUser.role === "STUDENT" && (
          <button className={tab === "student" ? "active" : ""} onClick={() => setTab("student")}>
            Student
          </button>
        )}
        {currentUser.role === "ADMIN" && (
          <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}>
            Admin
          </button>
        )}
        {currentUser.role === "COUNSELLOR" && (
          <button className={tab === "counsellor" ? "active" : ""} onClick={() => setTab("counsellor")}>
            Counsellor
          </button>
        )}
      </div>

      {tab === "student" && currentUser.role === "STUDENT" && (
        <div className="grid">
          <section className="card">
            <h2>Career Resources</h2>
            {resources.map((r) => (
              <div key={r.id} className="item">
                <b>{r.title}</b>
                <p>{r.careerPath}</p>
                <p>{r.description}</p>
                <a href={r.link} target="_blank" rel="noreferrer">Open Resource</a>
              </div>
            ))}
          </section>

          <section className="card">
            <h2>Schedule Counselling Session</h2>
            <form onSubmit={bookSession} className="form">
              <label>Counsellor</label>
              <select value={selectedCounsellor} onChange={(e) => setSelectedCounsellor(e.target.value)} required>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.expertise}
                  </option>
                ))}
              </select>

              <label>Date & Time</label>
              <input type="datetime-local" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} required />

              <label>Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>

              <button type="submit" disabled={!selectedStudent || !selectedCounsellor}>
                Book Session
              </button>
            </form>
          </section>

          <section className="card">
            <h2>My Sessions</h2>
            {studentSessions.map((s) => (
              <div key={s.id} className="item">
                <p><b>Counsellor:</b> {s.counsellor.name}</p>
                <p><b>Time:</b> {s.sessionTime}</p>
                <p><b>Mode:</b> {s.mode}</p>
                <p><b>Status:</b> {s.status}</p>
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === "admin" && currentUser.role === "ADMIN" && (
        <div className="grid">
          <section className="card">
            <h2>Add Career Resource</h2>
            <form onSubmit={addResource} className="form">
              <input placeholder="Title" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} required />
              <input placeholder="Career Path" value={newResource.careerPath} onChange={(e) => setNewResource({ ...newResource, careerPath: e.target.value })} required />
              <textarea placeholder="Description" value={newResource.description} onChange={(e) => setNewResource({ ...newResource, description: e.target.value })} required />
              <input placeholder="Resource Link" value={newResource.link} onChange={(e) => setNewResource({ ...newResource, link: e.target.value })} required />
              <button type="submit">Save Resource</button>
            </form>
          </section>

          <section className="card">
            <h2>User Engagement</h2>
            <button onClick={loadEngagement}>Load Engagement Stats</button>
            {engagement && (
              <div className="stats-grid">
                <div className="stat-card">
                  <span>Students</span>
                  <b>{engagement.totalStudents}</b>
                </div>
                <div className="stat-card">
                  <span>Counsellors</span>
                  <b>{engagement.totalCounsellors}</b>
                </div>
                <div className="stat-card">
                  <span>Resources</span>
                  <b>{engagement.totalResources}</b>
                </div>
                <div className="stat-card">
                  <span>Sessions</span>
                  <b>{engagement.totalSessions}</b>
                </div>
                <div className="stat-card">
                  <span>Activity Events</span>
                  <b>{engagement.totalActivityEvents}</b>
                </div>
              </div>
            )}
          </section>

          <section className="card">
            <div className="section-head">
              <h2>Manage Students</h2>
              <button onClick={loadAdminPeople}>Refresh</button>
            </div>
            {adminStudents.map((s) => (
              <div key={s.id} className="item row-item">
                <div>
                  <p><b>{s.fullName}</b></p>
                  <p>{s.email}</p>
                </div>
                <button className="danger-btn" onClick={() => deleteStudent(s.id)}>Delete</button>
              </div>
            ))}
            {adminStudents.length === 0 && <p className="hint">No students found.</p>}
          </section>

          <section className="card">
            <div className="section-head">
              <h2>Manage Counsellors</h2>
              <button onClick={loadAdminPeople}>Refresh</button>
            </div>
            {adminCounsellors.map((c) => (
              <div key={c.id} className="item row-item">
                <div>
                  <p><b>{c.name}</b></p>
                  <p>{c.email}</p>
                  <p>{c.expertise}</p>
                  <p><b>Career Path:</b> {c.careerPath || "Not provided"}</p>
                </div>
                <button className="danger-btn" onClick={() => deleteCounsellor(c.id)}>Delete</button>
              </div>
            ))}
            {adminCounsellors.length === 0 && <p className="hint">No counsellors found.</p>}
          </section>
        </div>
      )}

      {tab === "counsellor" && currentUser.role === "COUNSELLOR" && (
        <div className="grid">
          <section className="card">
            <h2>Counsellor Dashboard</h2>
            <p>You are successfully logged in as counsellor.</p>
            <p>You can guide students and help them choose the best career path.</p>
            <button onClick={() => loadCounsellorSessions()}>Refresh My Students</button>
          </section>
          <section className="card">
            <h2>Students Registered To Me</h2>
            {counsellorSessions.map((s) => (
              <div key={s.id} className="item">
                <p><b>Student:</b> {s.student.fullName}</p>
                <p><b>Email:</b> {s.student.email}</p>
                <p><b>Session:</b> {s.sessionTime}</p>
                <p><b>Mode:</b> {s.mode}</p>
                <p><b>Status:</b> {s.status}</p>
              </div>
            ))}
            {counsellorSessions.length === 0 && <p className="hint">No students booked sessions yet.</p>}
          </section>
          <section className="card">
            <h2>Career Resources</h2>
            {resources.map((r) => (
              <div key={r.id} className="item">
                <b>{r.title}</b>
                <p>{r.careerPath}</p>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
