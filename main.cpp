#include <iostream>
#include <string>
#include <algorithm>
#include <cctype>
#include <thread>
#include <chrono>

using namespace std;

enum HazardType {
    NONE,
    FIRE,
    FLOOD,
    EARTHQUAKE,
    VOLCANO
};

struct DeviceState {
    HazardType activeHazard = NONE;
    string ledColor = "OFF";
    bool speakerOn = false;
    bool smsSent = false;
    int batteryPercent = 100;
    int volumeLevel = 7; // 0-10
};

DeviceState state;

string toUpperCase(string text) {
    transform(text.begin(), text.end(), text.begin(),
              [](unsigned char c) { return std::toupper(c); });
    return text;
}

string hazardToString(HazardType hazard) {
    switch (hazard) {
        case FIRE: return "FIRE";
        case FLOOD: return "FLOOD";
        case EARTHQUAKE: return "EARTHQUAKE";
        case VOLCANO: return "VOLCANO";
        default: return "NONE";
    }
}

string getLedColorForHazard(HazardType hazard) {
    switch (hazard) {
        case FIRE: return "RED";
        case FLOOD: return "BLUE";
        case EARTHQUAKE: return "YELLOW";
        case VOLCANO: return "ORANGE";
        default: return "OFF";
    }
}

string getVoiceMessage(HazardType hazard) {
    switch (hazard) {
        case FIRE:
            return "Warning! Fire detected. Please evacuate immediately!";
        case FLOOD:
            return "Flood warning. Move to higher ground immediately!";
        case EARTHQUAKE:
            return "Earthquake alert. Drop, cover, and hold on!";
        case VOLCANO:
            return "Volcano alert. Follow official evacuation instructions!";
        default:
            return "System normal.";
    }
}

void showBatteryIndicator() {
    cout << "[BATTERY] Level: " << state.batteryPercent << "% -> ";

    if (state.batteryPercent > 50) {
        cout << "GREEN" << endl;
    } else if (state.batteryPercent > 20) {
        cout << "YELLOW" << endl;
    } else {
        cout << "RED" << endl;
    }
}

void activateLight(HazardType hazard) {
    state.ledColor = getLedColorForHazard(hazard);
    cout << "[LIGHT] LED ON -> " << state.ledColor << endl;
}

void activateSpeaker(HazardType hazard) {
    state.speakerOn = true;
    cout << "[SPEAKER] Volume: " << state.volumeLevel << "/10" << endl;
    cout << "[SPEAKER] Message: " << getVoiceMessage(hazard) << endl;
}

void sendSMS(HazardType hazard) {
    state.smsSent = true;
    cout << "[GSM] SMS SENT -> " << getVoiceMessage(hazard) << endl;
    cout << "[GSM] SMS SENT TO -> +628111111111, +628222222222" << endl;
}

void simulateDisplay(HazardType hazard) {
    cout << "[DISPLAY] " << hazardToString(hazard) << " - EVACUATE NOW" << endl;
}

void triggerHazard(HazardType hazard) {
    state.activeHazard = hazard;
    state.smsSent = false;

    cout << "\n==============================" << endl;
    cout << "[ALERT] Hazard detected: " << hazardToString(hazard) << endl;
    cout << "==============================" << endl;

    activateLight(hazard);
    activateSpeaker(hazard);
    simulateDisplay(hazard);
    sendSMS(hazard);

    cout << "[STATUS] Alert process complete." << endl;
}

void resetSystem() {
    state.activeHazard = NONE;
    state.ledColor = "OFF";
    state.speakerOn = false;
    state.smsSent = false;

    cout << "\n[RESET] System reset complete." << endl;
    cout << "[LIGHT] OFF" << endl;
    cout << "[SPEAKER] OFF" << endl;
    cout << "[DISPLAY] SYSTEM NORMAL" << endl;
}

void printStatus() {
    cout << "\n------ DEVICE STATUS ------" << endl;
    cout << "Hazard: " << hazardToString(state.activeHazard) << endl;
    cout << "LED: " << state.ledColor << endl;
    cout << "Speaker: " << (state.speakerOn ? "ON" : "OFF") << endl;
    cout << "SMS Sent: " << (state.smsSent ? "YES" : "NO") << endl;
    cout << "Battery: " << state.batteryPercent << "%" << endl;
    cout << "Volume: " << state.volumeLevel << "/10" << endl;
    cout << "---------------------------" << endl;
}

void printHelp() {
    cout << "\nAvailable commands:" << endl;
    cout << "  FIRE" << endl;
    cout << "  FLOOD" << endl;
    cout << "  EARTHQUAKE" << endl;
    cout << "  VOLCANO" << endl;
    cout << "  RESET" << endl;
    cout << "  STATUS" << endl;
    cout << "  BATTERY <0-100>" << endl;
    cout << "  VOLUME <0-10>" << endl;
    cout << "  HELP" << endl;
    cout << "  EXIT" << endl;
}

int main() {
    cout << "====================================" << endl;
    cout << " DisasterLink Multi-Hazard Simulator " << endl;
    cout << "====================================" << endl;

    showBatteryIndicator();
    printHelp();

    string input;

    while (true) {
        cout << "\nEnter command: ";
        getline(cin, input);

        string upper = toUpperCase(input);

        if (upper == "FIRE") {
            triggerHazard(FIRE);
        } else if (upper == "FLOOD") {
            triggerHazard(FLOOD);
        } else if (upper == "EARTHQUAKE") {
            triggerHazard(EARTHQUAKE);
        } else if (upper == "VOLCANO") {
            triggerHazard(VOLCANO);
        } else if (upper == "RESET") {
            resetSystem();
        } else if (upper == "STATUS") {
            printStatus();
        } else if (upper == "HELP") {
            printHelp();
        } else if (upper.rfind("BATTERY ", 0) == 0) {
            try {
                int value = stoi(input.substr(8));
                if (value >= 0 && value <= 100) {
                    state.batteryPercent = value;
                    showBatteryIndicator();
                } else {
                    cout << "[ERROR] Battery must be between 0 and 100." << endl;
                }
            } catch (...) {
                cout << "[ERROR] Invalid battery value." << endl;
            }
        } else if (upper.rfind("VOLUME ", 0) == 0) {
            try {
                int value = stoi(input.substr(7));
                if (value >= 0 && value <= 10) {
                    state.volumeLevel = value;
                    cout << "[VOLUME] Set to " << state.volumeLevel << "/10" << endl;
                } else {
                    cout << "[ERROR] Volume must be between 0 and 10." << endl;
                }
            } catch (...) {
                cout << "[ERROR] Invalid volume value." << endl;
            }
        } else if (upper == "EXIT") {
            cout << "Exiting simulator..." << endl;
            break;
        } else if (!input.empty()) {
            cout << "[ERROR] Unknown command. Type HELP." << endl;
        }
    }

    return 0;
}