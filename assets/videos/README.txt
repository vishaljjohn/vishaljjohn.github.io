Video-call background clips for the homepage live in this folder.

Name them call1.mp4, call2.mp4, ... (MP4 / H.264, muted, ideally 8-20s and
under ~15 MB each), then list them in the VIDEOS array near the top of the
script in index.html, e.g.

    var VIDEOS = ['call1.mp4', 'call2.mp4'];

Each visit starts on the next clip in the list. Only list files that exist:
every name is checked on each visit.
