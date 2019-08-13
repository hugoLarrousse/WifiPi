# WifiPi
Chromecast-like connection for raspberry Pi


### TO DO
 - **the "first connection"**
   - [X] Be able to connect from wifi or ethernet
   - [ ] Save multiple wifi connection (only 1 is allowed for now)

 - **the "reconnection"**
   - [X] If one of the saved network is reachable, try to reconnect a little longer
   - [X] If none of them is reachable go directly to "new connection"

 - **connection lost**
   - [ ] Be able to detect when the network is lost and reconnect or reboot the pi if necessary
   - [ ] Be able to detect when the main app (cast h7 for exemple) is down

  - **update remotely**
    - [ ] find a way to directly update the pi remotely (ssh or socket ? )

