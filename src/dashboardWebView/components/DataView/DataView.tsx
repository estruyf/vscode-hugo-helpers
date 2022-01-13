import * as React from 'react';
import { Header } from '../Header';
import { useRecoilValue } from 'recoil';
import { SettingsSelector } from '../../state';
import { DataForm } from './DataForm';
import { useCallback, useEffect, useState } from 'react';
import { DataFile } from '../../../models/DataFile';
import { Messenger } from '@estruyf/vscode/dist/client';
import { DashboardMessage } from '../../DashboardMessage';
import { SponsorMsg } from '../SponsorMsg';
import { EventData } from '@estruyf/vscode';
import { DashboardCommand } from '../../DashboardCommand';
import { Button } from '../Button';
import { arrayMoveImmutable } from 'array-move';
import { EmptyView } from './EmptyView';
import { Container } from './SortableContainer';
import { SortableItem } from './SortableItem';
import { ChevronRightIcon } from '@heroicons/react/outline';

export interface IDataViewProps {}

export const DataView: React.FunctionComponent<IDataViewProps> = (props: React.PropsWithChildren<IDataViewProps>) => {
  const [ selectedData, setSelectedData ] = useState<DataFile | null>(null);
  const [ selectedIndex, setSelectedIndex ] = useState<number | null>(null);
  const [ dataEntries, setDataEntries ] = useState<any[] | null>(null);
  const settings = useRecoilValue(SettingsSelector);

  const setSchema = (dataFile: DataFile) => {
    setSelectedData(dataFile);
    setSelectedIndex(null);
    setDataEntries(null);

    Messenger.send(DashboardMessage.getDataEntries, { ...dataFile });
  };

  const messageListener = (message: MessageEvent<EventData<any>>) => {
    if (message.data.command === DashboardCommand.dataFileEntries) {
      setDataEntries(message.data.data);
    }
  };

  const deleteItem = useCallback((index: number) => {
    const dataClone: any[] = Object.assign([], dataEntries);

    if (!selectedData) {
      return;
    }

    dataClone.splice(index, 1);

    Messenger.send(DashboardMessage.putDataEntries, {
      file: selectedData.file,
      entries: dataClone
    });
  }, [selectedData, dataEntries]);

  const onSubmit = useCallback((data: any) => {
    const dataClone: any[] = Object.assign([], dataEntries);
    if (selectedIndex !== null && selectedIndex !== undefined) {
      dataClone[selectedIndex] = data;
    } else {
      dataClone.push(data);
    }

    if (!selectedData) {
      return;
    }

    Messenger.send(DashboardMessage.putDataEntries, {
      file: selectedData.file,
      entries: dataClone
    });
  }, [selectedData, dataEntries, selectedIndex]);

  const onSortEnd = useCallback(({ oldIndex, newIndex }: any) => {
    if (!dataEntries || dataEntries.length === 0) {
      return null;
    }

    if (selectedIndex !== null && selectedIndex !== undefined) {
      setSelectedIndex(newIndex);
    }

    if (!selectedData) {
      return;
    }

    const newEntries = arrayMoveImmutable(dataEntries, oldIndex, newIndex);

    Messenger.send(DashboardMessage.putDataEntries, {
      file: selectedData.file,
      entries: newEntries
    });
  }, [selectedData, dataEntries, selectedIndex]);

  useEffect(() => {
    Messenger.listen(messageListener);

    return () => {
      Messenger.unlisten(messageListener);
    }
  }, []);
  
  return (
    <div className="flex flex-col h-full overflow-auto  inset-y-0">
      <Header settings={settings} />

      <div className="relative w-full flex-grow max-w-7xl mx-auto border-b border-gray-200 dark:border-vulcan-300">

        <div className={`flex w-64 flex-col absolute inset-y-0`}>

          <aside className={`flex flex-col flex-grow overflow-y-auto border-r border-gray-200 dark:border-vulcan-300  py-6 px-4`}>
            <h2 className={`text-lg text-gray-500 dark:text-whisper-900`}>Select your data type</h2>

            <nav className={`flex-1 py-4 -mx-4 `}>
              <div className={`divide-y divide-gray-200 dark:divide-vulcan-300 border-t border-b border-gray-200 dark:border-vulcan-300`}>
                {
                  (settings?.dataFiles && settings.dataFiles.length > 0) && (
                    settings.dataFiles.map((dataFile) => (
                      <button
                        key={dataFile.id}
                        type='button'
                        className={`px-4 py-2 flex items-center text-sm font-medium w-full text-left hover:bg-gray-200 dark:hover:bg-vulcan-400 hover:text-vulcan-500 dark:hover:text-whisper-500 ${selectedData?.id === dataFile.id ? 'bg-gray-300 dark:bg-vulcan-300 text-vulcan-500 dark:text-whisper-500' : 'text-gray-500 dark:text-whisper-900'}`}
                        onClick={() => setSchema(dataFile)}>
                        <ChevronRightIcon className='-ml-1 w-5 mr-2' />
                        <span>{dataFile.title}</span>
                      </button>
                    )
                  ))
                }
              </div>
            </nav>
          </aside>

        </div>

        <section className={`pl-64 flex min-w-0 h-full`}>
          {
            selectedData ? (
              <>
                <div className={`w-1/3 py-6 px-4 flex-1 border-r border-gray-200 dark:border-vulcan-300`}>
                  <h2 className={`text-lg text-gray-500 dark:text-whisper-900`}>Your {selectedData.title.toLowerCase()} data items</h2>

                  <div className='py-4'>
                    {
                      (dataEntries && dataEntries.length > 0) ? (
                        <>
                          <Container onSortEnd={onSortEnd} useDragHandle>
                            {
                              (dataEntries || []).map((dataEntry, idx) => (
                                <SortableItem 
                                  key={dataEntry[selectedData.labelField]}
                                  value={dataEntry[selectedData.labelField]}
                                  index={idx}
                                  crntIndex={idx}
                                  selectedIndex={selectedIndex}
                                  onSelectedIndexChange={(index: number) => setSelectedIndex(index)}
                                  onDeleteItem={deleteItem}
                                  />
                              ))
                            }
                          </Container>
                          <Button
                            className='mt-4'
                            onClick={() => setSelectedIndex(null)}>
                            Add a new entry
                          </Button>
                        </>
                      ) : (
                        <div className={`flex flex-col items-center justify-center`}>
                          <p className={`text-gray-500 dark:text-whisper-900`}>No {selectedData.title.toLowerCase()} data entries found</p>
                        </div>
                      )
                    }
                  </div>
                </div>
                <div className={`w-2/3 py-6 px-4`}>
                  <h2 className={`text-lg text-gray-500 dark:text-whisper-900`}>Create or modify your {selectedData.title.toLowerCase()} data</h2>
                  {
                    selectedData ? (
                      <DataForm 
                        schema={selectedData?.schema} 
                        model={(dataEntries && selectedIndex !== null && selectedIndex !== undefined) ? dataEntries[selectedIndex] : null} 
                        onSubmit={onSubmit}
                        onClear={() => setSelectedIndex(null)} />
                    ) : (
                      <p>Select a data type to get started</p>
                    )
                  }
                </div>
              </>
            ) : (
              <EmptyView />
            )
          }
        </section>
      </div>

      <SponsorMsg beta={settings?.beta} version={settings?.versionInfo} />
    </div>
  );
};