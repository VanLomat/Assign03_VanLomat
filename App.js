import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';

export default function App() {
    const [recording, setRecording] = useState(null);
    //  const [recordingURI, setRecordingURI] = useState([]);
    const [recordings, setRecordings] = useState([]);
    const [playback, setPlayback] = useState(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    const startRecording = async () => {
        try {
            // request permission to use the mic 
            if (permissionResponse.status !== 'granted') {
                console.log("Requesting Permissions");
                await requestPermission();
            }
            console.log("Permission is ", permissionResponse.status);

            //set some specific device values

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                //do not do this
                playsInSilentModeIOS: true,
            });

            console.log("Starting Recording...");
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            console.log("...Recording started");

        }
        catch (e) {
            console.error("Failed to startrecording(): ", e);
        }
    };
    const stopRecording = async () => {
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecordings((prevRecordings) => [...prevRecordings, uri]);
            setRecording(undefined);
            console.log('Recording stopped and stored at', uri);
        } catch (e) {
            console.error("Failed to stop recording", e);
        }

    };

    const playRecording = async (uri) => {
        const { sound } = await Audio.Sound.createAsync({
            uri })
        setPlayback(sound);
        await sound.replayAsync();
        //onsole.log('Playing recorded sound from ', recordingURI);
    };

    const deleteRecording = (index) => {
        Alert.alert(
            'Delete Recording',
            'Are you sure you want to delete this recording?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: () => {
                        setRecordings((prevRecordings) => prevRecordings.filter((_, i) => i !== index));
                    },
                },
            ]
        );
    };

    // stops recording and mic when the app stops
    useEffect(() => {
        return recording
            ? recording.stopRecordingAndUnloadAsync()
            : undefined;
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.controlContainer }>
            <Button
                title={recording ? 'Stop recording' : 'Start Recording'}
                onPress={recording ? stopRecording : startRecording}
            />
           
                <StatusBar style="auto" />

            </View>
            <ScrollView horizontal={true}>
                <View style={styles.buttonContainer}>
                {recordings.map((uri, index) => (
                    

                    <TouchableOpacity
                        key={index}
                        onLongPress={() => deleteRecording(index)}
                        style={styles.button}
                    >
                        <Button
                            title={`Play ${index + 1}`}
                            onPress={() => playRecording(uri)}
                            style={styles.innerButton}
                        />
                    </TouchableOpacity>
                ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlContainer: {
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
    },

    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
        marginTop: 20,
    },
    scrollView: {
        flex: 1,
    },
    button: {
        flex: 1,
        padding: 5,
        minWidth:20,
        marginHorizontal: 5, 
        
    },
});