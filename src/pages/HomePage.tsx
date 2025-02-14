// Add the calendar link to the grid
<Link
  to="/kalender"
  className="group bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
>
  <div className="flex flex-col items-center gap-4">
    <div className="p-4 bg-purple-50 rounded-full group-hover:bg-purple-100 transition-colors">
      <Calendar size={32} className="text-purple-600" />
    </div>
    <h2 className="text-2xl font-semibold text-gray-800">Wedstrijdkalender</h2>
    <p className="text-gray-600 text-center">
      Beheer de wedstrijdkalender en clubgegevens
    </p>
  </div>
</Link>