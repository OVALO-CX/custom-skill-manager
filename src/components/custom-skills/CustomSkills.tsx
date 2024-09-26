import React from 'react';
import { Autocomplete, Box, Card, Divider, IconButton, Sheet, Typography } from '@mui/joy';
import DeleteIcon from '@mui/icons-material/Delete';
import { Rating } from '@mui/material';
import { getAllLocations, getAllQueues, getAllSkills, getAllUsers, getQueueMembers, getUserSkills, updateUserRoutingSkills } from '../../utils/genesysCloudUtils';
import { Models } from 'purecloud-platform-client-v2';
import RefreshIcon from '@mui/icons-material/Refresh';


function CustomSkills({authenticatedUser} : {authenticatedUser: Models.User}) {
  const [filtered, setFiltered] = React.useState<boolean>(false)
  const [queues, setQueues] = React.useState<Models.Queue[]>([])
  const [skills, setSkills] = React.useState<Models.RoutingSkill[]>([])
  const [locations, setLocations] = React.useState<Models.LocationDefinition[]>([])
  const [users, setUsers] = React.useState<Models.User[]>([])
  const [usersSelected, setUsersSelected] = React.useState<string[]>([])
  const [queueUsers, setQueueUsers] = React.useState<string[]>([])
  const [elementsSelected, setElementsSelected] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)

  React.useEffect(() => {
    getAllLocations().then(lctns => setLocations(lctns))
  }, [])


  const loadElements = () => {
    setLoading(true)
    getAllQueues().then(qs => setQueues(qs))
      getAllSkills().then(sklls => setSkills(sklls))
      getAllUsers().then(usrs => {
        if(authenticatedUser.locations && authenticatedUser.locations?.length > 0) {
          const authUserLocationId =  authenticatedUser.locations[0].locationDefinition?.id
          const authUserCountry = locations.find(lct => lct.id == authUserLocationId)?.address?.country
          setUsers([...usrs.filter(usr => locations.find(loc => usr.locations && usr.locations.length > 0 
            &&  loc.id == usr.locations[0].locationDefinition?.id)?.address?.country == authUserCountry)])
        }
        setFiltered(true)
        setLoading(false)
      })
  }

  React.useEffect(() => {
    if(locations && locations.length > 0 && authenticatedUser.locations && authenticatedUser.locations?.length > 0) {
      loadElements()
    }
  }, [locations])

  const getUsers = (usrs : Models.User[]) => {
    if(!usrs || usrs.length == 0) {
      setUsersSelected([])
      setElementsSelected([...queueUsers])
      return
    }
    setUsersSelected(usrs.map(usr => usr.id || ''))
    if(usrs.length > usersSelected.length) {
      const newUser = usrs.find((user: any) => !usersSelected.find((usrId=> usrId == user.id)))
      if(!newUser || elementsSelected.find(elementId => elementId == newUser.id)) {
        return
      }
      setElementsSelected([...elementsSelected, newUser.id || ''])
    } else if(usrs.length < usersSelected.length) {
      const oldUserId = usersSelected.find(userId => !usrs.find((usr: any) => usr.id == userId))
      if(!oldUserId || queueUsers.find(usrId => usrId == oldUserId)) {
        return
      }
      setElementsSelected([...elementsSelected.filter(memberId => memberId != oldUserId)])
    }

  }

  const getQueueUsers = (queue: Models.Queue) => {
    if(!queue) {
      setElementsSelected([...usersSelected])
      setQueueUsers([])
      return
    }
    getQueueMembers(queue.id || '').then(mmbrs => {
      const usrs: string[] = mmbrs.filter(mmbr => users.find(usr => mmbr.id == usr.id)).map(mmbr => mmbr.id || '')
      setQueueUsers(usrs)
      setElementsSelected([...elementsSelected.filter(elementId => !queueUsers.find(queueUsrId => queueUsrId == elementId)), ...usersSelected, ...usrs])
    })
  }

  const updateUser = (userId : string, skills: any) => {
    updateUserRoutingSkills(userId, skills)
  }

  return (<>{filtered && <Sheet sx={{
    backgroundColor: 'white'
  }}><Sheet  sx={{
    p: 2,
  }}>
  <Box sx={{ display: 'flex', gap: 2 }}>
  <Autocomplete
  placeholder="Users"
  multiple
  value={users.filter(usr => usersSelected.find(userId => userId == usr.id))}
  size='sm'
  getOptionLabel={(option) => option.name || ''}
  isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
  onChange={(_, selected: any) => getUsers(selected)}
  options={users.sort((a: any,b: any) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0))}
  sx={{ width: 300 }}
/><Autocomplete
placeholder="Queues"
size='sm'
getOptionLabel={(option) => option.name || ''}
isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
onChange={(_, selected: any) => getQueueUsers(selected)}
options={queues.sort((a: any,b: any) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0))}
sx={{ width: 300, height: 20 }}
/><IconButton onClick={() => loadElements()} sx={{ height: 20 }}
  loading={loading}
><RefreshIcon />
</IconButton>
</Box><Divider sx={{mt: 2,mb: -2, mx: -2}}/></Sheet>

<Box sx={{ display: 'flex', gap: 1, p:1, flexDirection: 'column' }}>
  {users.filter(usr => elementsSelected.find(elementId => elementId == usr.id)).sort((a: any,b: any) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0)).map((member: any) => <Card key={member.id}  sx={{p:1}}><Box sx={{ display: 'flex', gap: 2,  }} justifyContent="space-between" alignItems='center'>
    <Typography level='title-sm'>{member.name}</Typography>
    <Autocomplete
      placeholder="Add a skill"
      size='sm'
      value={[]}
      multiple
      getOptionLabel={(option: any) => option?.name}
      isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
      onChange={(_, selected: any) => {
        const element = selected &&  selected[0]
        selected && setUsers([...users.map((mbr: any) => {
        if(mbr.skills && mbr.id == member.id) {
          updateUser(member.id, [...mbr.skills, {...element, proficiency: 0}])
          return {...mbr, skills: [...mbr.skills, element]}
        }
        return mbr
      })])}}
      options={skills.filter((skill: any) => member.skills && !member.skills.find((skll: any) => skll.id == skill.id))}
      sx={{ width: 300 }}
    />
 </Box>
 <Divider/>
 {member.skills && member.skills.sort((a: any,b: any) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map((skill: any) => 
 <Box key={skill.id} sx={{ display: 'flex', gap: 2,  }} justifyContent="space-between" alignItems='center'>
  <Typography sx={{width: 500}} level='body-sm'>{skill.name}</Typography>
  <Rating
    size='small'
    name="simple-controlled"
    onChange={(_, value) => {
      setUsers([...users.map((mbr: any) => {
        if(mbr.id == member.id) {
          updateUser(member.id, [...mbr.skills.filter((skll: any) => skll.id != skill.id), {...skill, proficiency: value}])
          return {...mbr, skills: [...mbr.skills.filter((skll: any) => skll.id != skill.id), {...skill, proficiency: value}]}
        }
        return mbr
      })])
    }}
    value={skill.proficiency}
    />
  <IconButton aria-label="delete" color='danger' variant='plain' size='sm' onClick={() => {
    setUsers([...users.map((mbr: any) => {
      if(mbr.id == member.id) {
        updateUser(member.id, [...mbr.skills.filter((skll: any) => skll.id != skill.id)])
        return {...mbr, skills: [...mbr.skills.filter((skll: any) => skll.id != skill.id)]}
      }
      return mbr
    })])
  }}>
    <DeleteIcon />
  </IconButton>
  </Box>)}
  </Card>)}
</Box>
</Sheet>}</>
      
  );
}

export default CustomSkills;
