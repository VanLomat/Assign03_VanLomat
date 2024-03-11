import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';

export default function App() {
    const [recording, setRecording] = useState(null);
    const [recordings, setRecordings] = useState([]);
    const [playback, setPlayback] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [looping, setLooping] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [loopOptions, setLoopOptions] = useState({});

    const startRecording = async () => {
        try {
            if (permissionResponse.status !== 'granted') {
                console.log("Requesting Permissions");
                await requestPermission();
            }
            console.log("Permission is ", permissionResponse.status);

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log("Starting Recording...");
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            console.log("...Recording started");

        } catch (e) {
            console.error("Failed to start recording(): ", e);
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

    const playRecording = async (uri, index) => {
        const { sound } = await Audio.Sound.createAsync({
            uri
        },
            { shouldPlay: true, isLooping: loopOptions[index] }
        );
        setPlayback(sound);
        setIsPlaying(true);
    };

    const stopPlayback = async () => {
        try {
            if (playback) {
                await playback.stopAsync();
                setIsPlaying(false);
            }
        } catch (error) {
            console.error('Failed to stop playback:', error);
        }
    };

    const toggleLooping = () => {
        setLooping(!looping);
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
                        const updatedRecordings = [...recordings];
                        updatedRecordings.splice(index, 1);
                        setRecordings(updatedRecordings);
                        setLoopOptions((prevLoopOptions) => {
                            const updatedLoopOptions = { ...prevLoopOptions };
                            delete updatedLoopOptions[index];
                            return updatedLoopOptions;
                        });
                    },
                },
            ]
        );
    };

    const handlePickerChange = (index, value) => {
        setLoopOptions(prevState => {
            return { ...prevState, [index]: value };
        });
    };

    useEffect(() => {
        return () => {
            if (playback) {
                playback.unloadAsync();
                setPlayback(null);
                setIsPlaying(false);
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.controlContainer}>
                <Button
                    title={recording ? 'Stop recording' : 'Start Recording'}
                    onPress={recording ? stopRecording : startRecording}
                />
                <Button
                    title={isPlaying ? 'Stop Playback' : 'Start Playback'}
                    onPress={isPlaying ? stopPlayback : () => playRecording(recordings[0])}
                />
                <Button
                    title={looping ? 'Disable Looping' : 'Enable Looping'}
                    onPress={toggleLooping}
                />
                <StatusBar style="auto" />
            </View>
            <ScrollView horizontal={true}>
                <View style={styles.buttonContainer}>
                    {recordings.map((uri, index) => (
                        <View key={index} style={styles.buttonWrapper}>
                            <TouchableOpacity
                                onLongPress={() => deleteRecording(index)}
                                style={styles.button}
                            >
                                <Button
                                    title={`Play ${index + 1}`}
                                    onPress={() => playRecording(uri, index)}
                                    style={styles.innerButton}
                                />
                            </TouchableOpacity>
                            <Picker
                                selectedValue={loopOptions[index]}
                                style={styles.picker}
                                onValueChange={(value) => handlePickerChange(index, value)}
                            >
                                <Picker.Item label="Play Once" value={false} />
                                <Picker.Item label="Loop" value={true} />
                            </Picker>
                        </View>
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
        paddingHorizontal: 10,
        marginTop: 20,
    },
    buttonWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
        marginHorizontal: 5,
    },
    innerButton: {
        flex: 1,
        minWidth:100,
    },
    picker: {
        width: 150,
        height: 40,
    },
});
