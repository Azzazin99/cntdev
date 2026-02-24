function renderAllLists() {
    renderNewsList('news');
    renderNewsList('activity'); // Will map to 'activities'
    renderListEditor('manuals');
    renderListEditor('plans');
    renderListEditor('forms');

    renderPersonnelEditor();
}
